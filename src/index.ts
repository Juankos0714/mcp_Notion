#!/usr/bin/env node

/**
 * MCP Server para documentación usando Gemini 1.5 (versión gratuita)
 * Reemplaza la funcionalidad de Notion con almacenamiento local y procesamiento con Gemini
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tipos para la documentación
interface DocumentPage {
  id: string;
  title: string;
  doc_type: 'api_endpoint' | 'feature' | 'bug_report' | 'general';
  content: DocumentationContent;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  tags: string[];
}

interface DocumentationContent {
  endpoint?: string;
  method?: string;
  description?: string;
  example?: string;
  name?: string;
  status?: string;
  title?: string;
  severity?: string;
  steps?: string;
  raw_content?: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

class GeminiDocsServer {
  private geminiApiKey: string | null = null;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  private dataDir: string;
  private docsFile: string;
  private client: AxiosInstance;

  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.docsFile = path.join(this.dataDir, 'documentation.json');
    
    // Crear directorio de datos si no existe
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Inicializar archivo de documentación si no existe
    if (!fs.existsSync(this.docsFile)) {
      fs.writeFileSync(this.docsFile, JSON.stringify([], null, 2));
    }

    this.client = axios.create({
      timeout: 30000,
    });
  }

  setupGeminiAuth(apiKey: string): void {
    this.geminiApiKey = apiKey;
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('API key de Gemini no configurado');
    }

    try {
      const response = await this.client.post<GeminiResponse>(
        `${this.baseUrl}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Respuesta inválida de Gemini API');
      }
    } catch (error: any) {
      console.error('Error calling Gemini:', error.response?.data || error.message);
      throw new Error(`Error de Gemini API: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private loadDocuments(): DocumentPage[] {
    try {
      const data = fs.readFileSync(this.docsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  private saveDocuments(docs: DocumentPage[]): void {
    try {
      fs.writeFileSync(this.docsFile, JSON.stringify(docs, null, 2));
    } catch (error) {
      console.error('Error saving documents:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async searchDocumentation(query: string, filterType?: string): Promise<DocumentPage[]> {
    const docs = this.loadDocuments();
    
    if (!query) {
      return filterType ? docs.filter(doc => doc.doc_type === filterType) : docs;
    }

    // Búsqueda simple por texto
    const queryLower = query.toLowerCase();
    const results = docs.filter(doc => {
      const searchText = `${doc.title} ${doc.content.description || ''} ${doc.content.name || ''} ${doc.content.title || ''}`.toLowerCase();
      const matchesQuery = searchText.includes(queryLower);
      const matchesType = !filterType || doc.doc_type === filterType;
      return matchesQuery && matchesType;
    });

    // Si tenemos Gemini configurado, mejoramos la búsqueda
    if (this.geminiApiKey && results.length === 0 && docs.length > 0) {
      try {
        const prompt = `
Analiza la siguiente consulta de búsqueda: "${query}"

Documentos disponibles:
${docs.map(doc => `- ${doc.title}: ${doc.content.description || 'Sin descripción'}`).join('\n')}

Devuelve SOLO los IDs de los documentos más relevantes separados por comas, o "ninguno" si no hay coincidencias relevantes:
`;

        const response = await this.callGemini(prompt);
        const relevantIds = response.trim().split(',').map(id => id.trim());
        
        if (relevantIds[0] !== 'ninguno') {
          return docs.filter(doc => relevantIds.includes(doc.id));
        }
      } catch (error) {
        console.error('Error en búsqueda con Gemini:', error);
      }
    }

    return results;
  }

  async getPageDetails(pageId: string): Promise<DocumentPage | null> {
    const docs = this.loadDocuments();
    return docs.find(doc => doc.id === pageId) || null;
  }

  async createDocumentationPage(
    parentId: string | undefined,
    title: string,
    docType: 'api_endpoint' | 'feature' | 'bug_report' | 'general',
    content: DocumentationContent = {}
  ): Promise<DocumentPage> {
    const docs = this.loadDocuments();
    
    const newDoc: DocumentPage = {
      id: this.generateId(),
      title,
      doc_type: docType,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: parentId,
      tags: []
    };

    // Si tenemos Gemini, mejoramos el contenido automáticamente
    if (this.geminiApiKey) {
      try {
        const prompt = this.createDocumentationPrompt(docType, title, content);
        const enhancedContent = await this.callGemini(prompt);
        
        // Parsear la respuesta de Gemini para extraer campos estructurados
        newDoc.content = this.parseGeminiDocumentationResponse(enhancedContent, docType);
      } catch (error) {
        console.error('Error mejorando contenido con Gemini:', error);
      }
    }

    docs.push(newDoc);
    this.saveDocuments(docs);
    
    return newDoc;
  }

  private createDocumentationPrompt(docType: string, title: string, content: DocumentationContent): string {
    const basePrompt = `Crea documentación detallada para: "${title}"
Tipo: ${docType}
Contenido existente: ${JSON.stringify(content, null, 2)}

Devuelve la respuesta en formato JSON con la siguiente estructura:`;

    switch (docType) {
      case 'api_endpoint':
        return `${basePrompt}
{
  "endpoint": "ruta del endpoint",
  "method": "método HTTP",
  "description": "descripción detallada del endpoint",
  "example": "ejemplo de respuesta JSON",
  "parameters": "parámetros requeridos",
  "responses": "códigos de respuesta posibles"
}`;

      case 'feature':
        return `${basePrompt}
{
  "name": "nombre de la característica",
  "status": "estado actual",
  "description": "descripción completa de la característica",
  "requirements": "requisitos técnicos",
  "implementation_notes": "notas de implementación"
}`;

      case 'bug_report':
        return `${basePrompt}
{
  "title": "título del bug",
  "severity": "nivel de severidad",
  "description": "descripción del problema",
  "steps": "pasos para reproducir",
  "expected_behavior": "comportamiento esperado",
  "actual_behavior": "comportamiento actual"
}`;

      default:
        return `${basePrompt}
{
  "description": "descripción completa del documento",
  "content": "contenido principal",
  "notes": "notas adicionales"
}`;
    }
  }

  private parseGeminiDocumentationResponse(response: string, docType: string): DocumentationContent {
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { ...parsed, raw_content: response };
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
    }

    // Si no se puede parsear, usar el contenido crudo
    return {
      description: response,
      raw_content: response
    };
  }

  async updateDocumentation(pageId: string, updates: Partial<DocumentationContent>): Promise<DocumentPage | null> {
    const docs = this.loadDocuments();
    const docIndex = docs.findIndex(doc => doc.id === pageId);
    
    if (docIndex === -1) {
      return null;
    }

    docs[docIndex].content = { ...docs[docIndex].content, ...updates };
    docs[docIndex].updated_at = new Date().toISOString();

    // Si tenemos Gemini, podemos mejorar las actualizaciones
    if (this.geminiApiKey && updates.description) {
      try {
        const prompt = `
Mejora la siguiente descripción de documentación técnica:
"${updates.description}"

Tipo de documento: ${docs[docIndex].doc_type}
Contexto existente: ${JSON.stringify(docs[docIndex].content, null, 2)}

Devuelve una versión mejorada y más detallada manteniendo el formato apropiado para el tipo de documento:
`;

        const enhancedDescription = await this.callGemini(prompt);
        docs[docIndex].content.description = enhancedDescription;
      } catch (error) {
        console.error('Error mejorando actualización con Gemini:', error);
      }
    }

    this.saveDocuments(docs);
    return docs[docIndex];
  }

  async addContentToPage(pageId: string, contentType: string, content: string): Promise<boolean> {
    const docs = this.loadDocuments();
    const docIndex = docs.findIndex(doc => doc.id === pageId);
    
    if (docIndex === -1) {
      return false;
    }

    // Agregar el nuevo contenido al documento
    const currentContent = docs[docIndex].content.raw_content || docs[docIndex].content.description || '';
    const newContent = `${currentContent}\n\n## ${contentType.toUpperCase()}\n${content}`;
    
    docs[docIndex].content.raw_content = newContent;
    docs[docIndex].updated_at = new Date().toISOString();

    this.saveDocuments(docs);
    return true;
  }

  async generateDocumentationSummary(): Promise<string> {
    const docs = this.loadDocuments();
    
    if (!this.geminiApiKey) {
      return `Resumen de documentación:
- Total de documentos: ${docs.length}
- APIs: ${docs.filter(d => d.doc_type === 'api_endpoint').length}
- Características: ${docs.filter(d => d.doc_type === 'feature').length}
- Reportes de bugs: ${docs.filter(d => d.doc_type === 'bug_report').length}
- Generales: ${docs.filter(d => d.doc_type === 'general').length}`;
    }

    const prompt = `
Genera un resumen ejecutivo de la siguiente documentación técnica:

${docs.map(doc => `
Título: ${doc.title}
Tipo: ${doc.doc_type}
Descripción: ${doc.content.description || 'Sin descripción'}
Última actualización: ${doc.updated_at}
`).join('\n---\n')}

Crea un resumen ejecutivo que incluya:
1. Estado general del proyecto
2. APIs principales y su funcionalidad
3. Características en desarrollo
4. Problemas conocidos (bugs)
5. Recomendaciones
`;

    try {
      return await this.callGemini(prompt);
    } catch (error) {
      console.error('Error generando resumen:', error);
      return 'Error al generar resumen con Gemini API';
    }
  }

  async analyzeDocumentation(query: string): Promise<string> {
    const docs = this.loadDocuments();
    
    if (!this.geminiApiKey) {
      return 'Análisis no disponible sin API key de Gemini';
    }

    const prompt = `
Analiza la siguiente documentación técnica basándote en la consulta: "${query}"

Documentación disponible:
${docs.map(doc => `
ID: ${doc.id}
Título: ${doc.title}
Tipo: ${doc.doc_type}
Contenido: ${JSON.stringify(doc.content, null, 2)}
`).join('\n---\n')}

Proporciona un análisis detallado que responda a la consulta específica.
`;

    try {
      return await this.callGemini(prompt);
    } catch (error) {
      console.error('Error en análisis:', error);
      return 'Error al analizar documentación con Gemini API';
    }
  }
}

// Crear instancia del servidor MCP
const server = new Server(
  {
    name: "gemini-docs-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const geminiServer = new GeminiDocsServer();

// Herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "setup_gemini_auth",
        description: "Configurar API key de Gemini 1.5 (gratuito)",
        inputSchema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description: "API key de Google AI Studio (Gemini)"
            }
          },
          required: ["api_key"]
        }
      },
      {
        name: "search_documentation",
        description: "Buscar documentación con búsqueda inteligente usando Gemini",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Término de búsqueda o consulta en lenguaje natural"
            },
            filter_type: {
              type: "string",
              description: "Tipo de documento (api_endpoint, feature, bug_report, general)",
              enum: ["api_endpoint", "feature", "bug_report", "general"]
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_page_details",
        description: "Obtener detalles completos de un documento",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "ID del documento"
            }
          },
          required: ["page_id"]
        }
      },
      {
        name: "create_documentation_page",
        description: "Crear nueva documentación con asistencia de Gemini",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: {
              type: "string",
              description: "ID del documento padre (opcional)"
            },
            title: {
              type: "string",
              description: "Título del documento"
            },
            doc_type: {
              type: "string",
              description: "Tipo de documentación",
              enum: ["api_endpoint", "feature", "bug_report", "general"]
            },
            content: {
              type: "object",
              description: "Contenido inicial (será mejorado por Gemini)"
            }
          },
          required: ["title", "doc_type"]
        }
      },
      {
        name: "update_documentation",
        description: "Actualizar documentación existente con mejoras de Gemini",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "ID del documento a actualizar"
            },
            updates: {
              type: "object",
              description: "Cambios a realizar"
            }
          },
          required: ["page_id", "updates"]
        }
      },
      {
        name: "add_content_to_page",
        description: "Añadir contenido a documento existente",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "ID del documento"
            },
            content_type: {
              type: "string",
              description: "Tipo de contenido",
              enum: ["paragraph", "heading", "code", "list", "quote", "example"]
            },
            content: {
              type: "string",
              description: "Contenido a añadir"
            }
          },
          required: ["page_id", "content_type", "content"]
        }
      },
      {
        name: "generate_documentation_summary",
        description: "Generar resumen ejecutivo de toda la documentación",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "analyze_documentation",
        description: "Analizar documentación usando Gemini con consultas específicas",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Consulta o análisis específico a realizar"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

// Manejador de llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "setup_gemini_auth":
        geminiServer.setupGeminiAuth(args.api_key);
        return {
          content: [
            {
              type: "text",
              text: "✅ API key de Gemini configurado correctamente. Ya puedes usar todas las funcionalidades con IA."
            } as TextContent
          ]
        };

      case "search_documentation":
        const results = await geminiServer.searchDocumentation(args.query, args.filter_type);
        
        return {
          content: [
            {
              type: "text",
              text: `📚 Encontrados ${results.length} documentos:\n\n${
                results.map(doc => `🔹 **${doc.title}** (${doc.doc_type})\n   📝 ${doc.content.description || 'Sin descripción'}\n   🆔 ID: ${doc.id}\n   📅 ${new Date(doc.updated_at).toLocaleDateString()}`).join('\n\n')
              }`
            } as TextContent
          ]
        };

      case "get_page_details":
        const pageInfo = await geminiServer.getPageDetails(args.page_id);
        
        if (!pageInfo) {
          return {
            content: [
              {
                type: "text",
                text: "❌ Documento no encontrado"
              } as TextContent
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `📄 **Detalles del documento**\n\n` +
                    `**Título:** ${pageInfo.title}\n` +
                    `**Tipo:** ${pageInfo.doc_type}\n` +
                    `**ID:** ${pageInfo.id}\n` +
                    `**Creado:** ${new Date(pageInfo.created_at).toLocaleString()}\n` +
                    `**Actualizado:** ${new Date(pageInfo.updated_at).toLocaleString()}\n\n` +
                    `**Contenido:**\n${JSON.stringify(pageInfo.content, null, 2)}`
            } as TextContent
          ]
        };

      case "create_documentation_page":
        const newPage = await geminiServer.createDocumentationPage(
          args.parent_id,
          args.title,
          args.doc_type,
          args.content || {}
        );

        return {
          content: [
            {
              type: "text",
              text: `✅ **Documento creado exitosamente**\n\n` +
                    `**Título:** ${newPage.title}\n` +
                    `**Tipo:** ${newPage.doc_type}\n` +
                    `**ID:** ${newPage.id}\n\n` +
                    `**Contenido generado:**\n${JSON.stringify(newPage.content, null, 2)}`
            } as TextContent
          ]
        };

      case "update_documentation":
        const updatedPage = await geminiServer.updateDocumentation(args.page_id, args.updates);

        if (!updatedPage) {
          return {
            content: [
              {
                type: "text",
                text: "❌ Documento no encontrado para actualizar"
              } as TextContent
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ **Documento actualizado**\n\n` +
                    `**Título:** ${updatedPage.title}\n` +
                    `**ID:** ${updatedPage.id}\n` +
                    `**Última actualización:** ${new Date(updatedPage.updated_at).toLocaleString()}\n\n` +
                    `**Nuevo contenido:**\n${JSON.stringify(updatedPage.content, null, 2)}`
            } as TextContent
          ]
        };

      case "add_content_to_page":
        const success = await geminiServer.addContentToPage(
          args.page_id,
          args.content_type,
          args.content
        );

        return {
          content: [
            {
              type: "text",
              text: success ? 
                `✅ Contenido añadido al documento ${args.page_id}` :
                `❌ Error: Documento ${args.page_id} no encontrado`
            } as TextContent
          ]
        };

      case "generate_documentation_summary":
        const summary = await geminiServer.generateDocumentationSummary();

        return {
          content: [
            {
              type: "text",
              text: `📊 **Resumen de Documentación**\n\n${summary}`
            } as TextContent
          ]
        };

      case "analyze_documentation":
        const analysis = await geminiServer.analyzeDocumentation(args.query);

        return {
          content: [
            {
              type: "text",
              text: `🔍 **Análisis de Documentación**\n\n${analysis}`
            } as TextContent
          ]
        };

      default:
        return {
          content: [
            {
              type: "text",
              text: `❌ Herramienta desconocida: ${name}`
            } as TextContent
          ]
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ **Error:** ${error.message}`
        } as TextContent
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Gemini Documentation MCP Server ejecutándose en stdio");
}

main().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
