#!/usr/bin/env node

/**
 * MCP Server para interactuar con plantilla de documentación de desarrollo de software en Notion
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
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Tipos para Notion API
interface NotionPage {
  object: string;
  id: string;
  created_time: string;
  last_edited_time: string;
  parent: any;
  archived: boolean;
  properties: any;
  url: string;
}

interface NotionBlock {
  object: string;
  id: string;
  type: string;
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
  [key: string]: any;
}

interface NotionDatabase {
  object: string;
  id: string;
  title: any[];
  description: any[];
  properties: any;
  url: string;
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
}

class NotionDocsServer {
  private notionToken: string | null = null;
  private baseUrl = "https://api.notion.com/v1";
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
  }

  setupNotionAuth(token: string): void {
    this.notionToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PATCH',
    endpoint: string,
    data?: any
  ): Promise<T> {
    try {
      let response: AxiosResponse<T>;

      switch (method) {
        case 'GET':
          response = await this.client.get(endpoint, { params: data });
          break;
        case 'POST':
          response = await this.client.post(endpoint, data);
          break;
        case 'PATCH':
          response = await this.client.patch(endpoint, data);
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${method}`);
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error(`Error HTTP ${error.response.status}:`, error.response.data);
        throw new Error(`Notion API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      console.error('Error en petición a Notion:', error.message);
      throw error;
    }
  }

  async searchPages(query: string = "", filterType: string = "page"): Promise<NotionPage[]> {
    const searchData = {
      query,
      filter: {
        value: filterType,
        property: "object"
      }
    };

    const result = await this.makeRequest<{ results: NotionPage[] }>('POST', '/search', searchData);
    return result.results || [];
  }

  async getPage(pageId: string): Promise<NotionPage> {
    return await this.makeRequest<NotionPage>('GET', `/pages/${pageId}`);
  }

  async getPageContent(pageId: string): Promise<NotionBlock[]> {
    const result = await this.makeRequest<{ results: NotionBlock[] }>('GET', `/blocks/${pageId}/children`);
    return result.results || [];
  }

  async createPage(
    parentId: string,
    title: string,
    properties?: any,
    content?: any[]
  ): Promise<NotionPage> {
    const pageData: any = {
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      }
    };

    if (properties) {
      pageData.properties = { ...pageData.properties, ...properties };
    }

    if (content) {
      pageData.children = content;
    }

    return await this.makeRequest<NotionPage>('POST', '/pages', pageData);
  }

  async updatePage(pageId: string, properties: any): Promise<NotionPage> {
    const updateData = { properties };
    return await this.makeRequest<NotionPage>('PATCH', `/pages/${pageId}`, updateData);
  }

  async addBlocksToPage(pageId: string, blocks: any[]): Promise<any> {
    const blocksData = { children: blocks };
    return await this.makeRequest('PATCH', `/blocks/${pageId}/children`, blocksData);
  }

  async queryDatabase(
    databaseId: string,
    filters?: any,
    sorts?: any[]
  ): Promise<NotionPage[]> {
    const queryData: any = {};

    if (filters) {
      queryData.filter = filters;
    }

    if (sorts) {
      queryData.sorts = sorts;
    }

    const result = await this.makeRequest<{ results: NotionPage[] }>('POST', `/databases/${databaseId}/query`, queryData);
    return result.results || [];
  }

  createDocumentationBlocks(docType: string, content: DocumentationContent): any[] {
    const blocks: any[] = [];

    switch (docType) {
      case "api_endpoint":
        blocks.push(
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: `API Endpoint: ${content.endpoint || ''}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: `Método: ${content.method || 'GET'}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: `Descripción: ${content.description || ''}` } }]
            }
          },
          {
            object: "block",
            type: "code",
            code: {
              caption: [],
              rich_text: [{ type: "text", text: { content: content.example || '' } }],
              language: "json"
            }
          }
        );
        break;

      case "feature":
        blocks.push(
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: `Feature: ${content.name || ''}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: `Estado: ${content.status || 'En desarrollo'}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: content.description || '' } }]
            }
          }
        );
        break;

      case "bug_report":
        blocks.push(
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: `Bug Report: ${content.title || ''}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: `Severidad: ${content.severity || 'Media'}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: `Descripción: ${content.description || ''}` } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: `Pasos para reproducir: ${content.steps || ''}` } }]
            }
          }
        );
        break;

      default:
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: content.description || '' } }]
          }
        });
    }

    return blocks;
  }

  createContentBlock(contentType: string, content: string, language?: string): any {
    switch (contentType) {
      case "paragraph":
        return {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content } }]
          }
        };

      case "heading":
        return {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content } }]
          }
        };

      case "code":
        return {
          object: "block",
          type: "code",
          code: {
            rich_text: [{ type: "text", text: { content } }],
            language: language || "text"
          }
        };

      case "quote":
        return {
          object: "block",
          type: "quote",
          quote: {
            rich_text: [{ type: "text", text: { content } }]
          }
        };

      case "list":
        return {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content } }]
          }
        };

      default:
        throw new Error(`Tipo de contenido no soportado: ${contentType}`);
    }
  }
}

// Crear instancia del servidor MCP
const server = new Server(
  {
    name: "notion-docs-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const notionServer = new NotionDocsServer();

// Herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "setup_notion_auth",
        description: "Configurar token de autenticación para Notion",
        inputSchema: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "Token de integración de Notion"
            }
          },
          required: ["token"]
        }
      },
      {
        name: "search_documentation",
        description: "Buscar páginas de documentación en Notion",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Término de búsqueda"
            },
            filter_type: {
              type: "string",
              description: "Tipo de objeto a buscar (page, database)",
              default: "page"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_page_details",
        description: "Obtener detalles de una página específica",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "ID de la página de Notion"
            }
          },
          required: ["page_id"]
        }
      },
      {
        name: "create_documentation_page",
        description: "Crear una nueva página de documentación",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: {
              type: "string",
              description: "ID de la página padre"
            },
            title: {
              type: "string",
              description: "Título de la página"
            },
            doc_type: {
              type: "string",
              description: "Tipo de documentación (api_endpoint, feature, bug_report, general)",
              enum: ["api_endpoint", "feature", "bug_report", "general"]
            },
            content: {
              type: "object",
              description: "Contenido específico según el tipo de documentación"
            }
          },
          required: ["parent_id", "title", "doc_type"]
        }
      },
      {
        name: "update_documentation",
        description: "Actualizar una página de documentación existente",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "ID de la página a actualizar"
            },
            properties: {
              type: "object",
              description: "Propiedades a actualizar"
            }
          },
          required: ["page_id", "properties"]
        }
      },
      {
        name: "query_documentation_database",
        description: "Consultar base de datos de documentación",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "string",
              description: "ID de la base de datos"
            },
            filters: {
              type: "object",
              description: "Filtros para la consulta"
            },
            sorts: {
              type: "array",
              description: "Criterios de ordenamiento"
            }
          },
          required: ["database_id"]
        }
      },
      {
        name: "add_content_to_page",
        description: "Añadir contenido a una página existente",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "ID de la página"
            },
            content_type: {
              type: "string",
              description: "Tipo de contenido a añadir",
              enum: ["paragraph", "heading", "code", "list", "quote"]
            },
            content: {
              type: "string",
              description: "Contenido a añadir"
            },
            language: {
              type: "string",
              description: "Lenguaje para bloques de código (opcional)"
            }
          },
          required: ["page_id", "content_type", "content"]
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
      case "setup_notion_auth":
        notionServer.setupNotionAuth(args.token);
        return {
          content: [
            {
              type: "text",
              text: "Autenticación configurada correctamente"
            } as TextContent
          ]
        };

      case "search_documentation":
        const results = await notionServer.searchPages(args.query, args.filter_type || "page");
        
        const formattedResults = results.slice(0, 10).map(result => {
          let title = "";
          if (result.properties?.title?.title?.[0]?.text?.content) {
            title = result.properties.title.title[0].text.content;
          }
          
          return {
            id: result.id,
            title,
            url: result.url,
            last_edited: result.last_edited_time
          };
        });

        return {
          content: [
            {
              type: "text",
              text: `Encontradas ${results.length} páginas:\n\n${JSON.stringify(formattedResults, null, 2)}`
            } as TextContent
          ]
        };

      case "get_page_details":
        const pageInfo = await notionServer.getPage(args.page_id);
        const pageContent = await notionServer.getPageContent(args.page_id);

        return {
          content: [
            {
              type: "text",
              text: `Información de la página:\n\n` +
                    `ID: ${pageInfo.id}\n` +
                    `URL: ${pageInfo.url}\n` +
                    `Última edición: ${pageInfo.last_edited_time}\n\n` +
                    `Contenido (${pageContent.length} bloques):\n` +
                    JSON.stringify(pageContent, null, 2)
            } as TextContent
          ]
        };

      case "create_documentation_page":
        const blocks = notionServer.createDocumentationBlocks(args.doc_type, args.content || {});
        const newPage = await notionServer.createPage(args.parent_id, args.title, undefined, blocks);

        return {
          content: [
            {
              type: "text",
              text: `Página de documentación creada:\n\n` +
                    `ID: ${newPage.id}\n` +
                    `URL: ${newPage.url}\n` +
                    `Tipo: ${args.doc_type}`
            } as TextContent
          ]
        };

      case "update_documentation":
        const updatedPage = await notionServer.updatePage(args.page_id, args.properties);

        return {
          content: [
            {
              type: "text",
              text: `Página actualizada:\n\n` +
                    `ID: ${updatedPage.id}\n` +
                    `Última edición: ${updatedPage.last_edited_time}`
            } as TextContent
          ]
        };

      case "query_documentation_database":
        const dbResults = await notionServer.queryDatabase(
          args.database_id,
          args.filters,
          args.sorts
        );

        return {
          content: [
            {
              type: "text",
              text: `Resultados de la consulta (${dbResults.length} elementos):\n\n` +
                    JSON.stringify(dbResults, null, 2)
            } as TextContent
          ]
        };

      case "add_content_to_page":
        const block = notionServer.createContentBlock(
          args.content_type,
          args.content,
          args.language
        );

        await notionServer.addBlocksToPage(args.page_id, [block]);

        return {
          content: [
            {
              type: "text",
              text: `Contenido añadido a la página ${args.page_id}`
            } as TextContent
          ]
        };

      default:
        return {
          content: [
            {
              type: "text",
              text: `Herramienta desconocida: ${name}`
            } as TextContent
          ]
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        } as TextContent
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion Documentation MCP Server ejecutándose en stdio");
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});