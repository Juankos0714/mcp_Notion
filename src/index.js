#!/usr/bin/env node
"use strict";
/**
 * MCP Server para interactuar con plantilla de documentación de desarrollo de software en Notion
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var axios_1 = require("axios");
var NotionDocsServer = /** @class */ (function () {
    function NotionDocsServer() {
        this.notionToken = null;
        this.baseUrl = "https://api.notion.com/v1";
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });
    }
    NotionDocsServer.prototype.setupNotionAuth = function (token) {
        this.notionToken = token;
        this.client.defaults.headers.common['Authorization'] = "Bearer ".concat(token);
    };
    NotionDocsServer.prototype.makeRequest = function (method, endpoint, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        response = void 0;
                        _a = method;
                        switch (_a) {
                            case 'GET': return [3 /*break*/, 1];
                            case 'POST': return [3 /*break*/, 3];
                            case 'PATCH': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, this.client.get(endpoint, { params: data })];
                    case 2:
                        response = _b.sent();
                        return [3 /*break*/, 8];
                    case 3: return [4 /*yield*/, this.client.post(endpoint, data)];
                    case 4:
                        response = _b.sent();
                        return [3 /*break*/, 8];
                    case 5: return [4 /*yield*/, this.client.patch(endpoint, data)];
                    case 6:
                        response = _b.sent();
                        return [3 /*break*/, 8];
                    case 7: throw new Error("M\u00E9todo HTTP no soportado: ".concat(method));
                    case 8: return [2 /*return*/, response.data];
                    case 9:
                        error_1 = _b.sent();
                        if (error_1.response) {
                            console.error("Error HTTP ".concat(error_1.response.status, ":"), error_1.response.data);
                            throw new Error("Notion API Error: ".concat(error_1.response.status, " - ").concat(JSON.stringify(error_1.response.data)));
                        }
                        console.error('Error en petición a Notion:', error_1.message);
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    NotionDocsServer.prototype.searchPages = function () {
        return __awaiter(this, arguments, void 0, function (query, filterType) {
            var searchData, result;
            if (query === void 0) { query = ""; }
            if (filterType === void 0) { filterType = "page"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchData = {
                            query: query,
                            filter: {
                                value: filterType,
                                property: "object"
                            }
                        };
                        return [4 /*yield*/, this.makeRequest('POST', '/search', searchData)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.results || []];
                }
            });
        });
    };
    NotionDocsServer.prototype.getPage = function (pageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.makeRequest('GET', "/pages/".concat(pageId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotionDocsServer.prototype.getPageContent = function (pageId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.makeRequest('GET', "/blocks/".concat(pageId, "/children"))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.results || []];
                }
            });
        });
    };
    NotionDocsServer.prototype.createPage = function (parentId, title, properties, content) {
        return __awaiter(this, void 0, void 0, function () {
            var pageData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pageData = {
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
                            pageData.properties = __assign(__assign({}, pageData.properties), properties);
                        }
                        if (content) {
                            pageData.children = content;
                        }
                        return [4 /*yield*/, this.makeRequest('POST', '/pages', pageData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotionDocsServer.prototype.updatePage = function (pageId, properties) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = { properties: properties };
                        return [4 /*yield*/, this.makeRequest('PATCH', "/pages/".concat(pageId), updateData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotionDocsServer.prototype.addBlocksToPage = function (pageId, blocks) {
        return __awaiter(this, void 0, void 0, function () {
            var blocksData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blocksData = { children: blocks };
                        return [4 /*yield*/, this.makeRequest('PATCH', "/blocks/".concat(pageId, "/children"), blocksData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NotionDocsServer.prototype.queryDatabase = function (databaseId, filters, sorts) {
        return __awaiter(this, void 0, void 0, function () {
            var queryData, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryData = {};
                        if (filters) {
                            queryData.filter = filters;
                        }
                        if (sorts) {
                            queryData.sorts = sorts;
                        }
                        return [4 /*yield*/, this.makeRequest('POST', "/databases/".concat(databaseId, "/query"), queryData)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.results || []];
                }
            });
        });
    };
    NotionDocsServer.prototype.createDocumentationBlocks = function (docType, content) {
        var blocks = [];
        switch (docType) {
            case "api_endpoint":
                blocks.push({
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [{ type: "text", text: { content: "API Endpoint: ".concat(content.endpoint || '') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: "M\u00E9todo: ".concat(content.method || 'GET') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: "Descripci\u00F3n: ".concat(content.description || '') } }]
                    }
                }, {
                    object: "block",
                    type: "code",
                    code: {
                        caption: [],
                        rich_text: [{ type: "text", text: { content: content.example || '' } }],
                        language: "json"
                    }
                });
                break;
            case "feature":
                blocks.push({
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [{ type: "text", text: { content: "Feature: ".concat(content.name || '') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: "Estado: ".concat(content.status || 'En desarrollo') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: content.description || '' } }]
                    }
                });
                break;
            case "bug_report":
                blocks.push({
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [{ type: "text", text: { content: "Bug Report: ".concat(content.title || '') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: "Severidad: ".concat(content.severity || 'Media') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: "Descripci\u00F3n: ".concat(content.description || '') } }]
                    }
                }, {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: "Pasos para reproducir: ".concat(content.steps || '') } }]
                    }
                });
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
    };
    NotionDocsServer.prototype.createContentBlock = function (contentType, content, language) {
        switch (contentType) {
            case "paragraph":
                return {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ type: "text", text: { content: content } }]
                    }
                };
            case "heading":
                return {
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [{ type: "text", text: { content: content } }]
                    }
                };
            case "code":
                return {
                    object: "block",
                    type: "code",
                    code: {
                        rich_text: [{ type: "text", text: { content: content } }],
                        language: language || "text"
                    }
                };
            case "quote":
                return {
                    object: "block",
                    type: "quote",
                    quote: {
                        rich_text: [{ type: "text", text: { content: content } }]
                    }
                };
            case "list":
                return {
                    object: "block",
                    type: "bulleted_list_item",
                    bulleted_list_item: {
                        rich_text: [{ type: "text", text: { content: content } }]
                    }
                };
            default:
                throw new Error("Tipo de contenido no soportado: ".concat(contentType));
        }
    };
    return NotionDocsServer;
}());
// Crear instancia del servidor MCP
var server = new index_js_1.Server({
    name: "notion-docs-mcp",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
var notionServer = new NotionDocsServer();
// Herramientas disponibles
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
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
            }];
    });
}); });
// Manejador de llamadas a herramientas
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, args, _b, results, formattedResults, pageInfo, pageContent, blocks, newPage, updatedPage, dbResults, block, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = request.params, name = _a.name, args = _a.arguments;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 18, , 19]);
                _b = name;
                switch (_b) {
                    case "setup_notion_auth": return [3 /*break*/, 2];
                    case "search_documentation": return [3 /*break*/, 3];
                    case "get_page_details": return [3 /*break*/, 5];
                    case "create_documentation_page": return [3 /*break*/, 8];
                    case "update_documentation": return [3 /*break*/, 10];
                    case "query_documentation_database": return [3 /*break*/, 12];
                    case "add_content_to_page": return [3 /*break*/, 14];
                }
                return [3 /*break*/, 16];
            case 2:
                notionServer.setupNotionAuth(args.token);
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Autenticación configurada correctamente"
                            }
                        ]
                    }];
            case 3: return [4 /*yield*/, notionServer.searchPages(args.query, args.filter_type || "page")];
            case 4:
                results = _c.sent();
                formattedResults = results.slice(0, 10).map(function (result) {
                    var _a, _b, _c, _d, _e;
                    var title = "";
                    if ((_e = (_d = (_c = (_b = (_a = result.properties) === null || _a === void 0 ? void 0 : _a.title) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.text) === null || _e === void 0 ? void 0 : _e.content) {
                        title = result.properties.title.title[0].text.content;
                    }
                    return {
                        id: result.id,
                        title: title,
                        url: result.url,
                        last_edited: result.last_edited_time
                    };
                });
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Encontradas ".concat(results.length, " p\u00E1ginas:\n\n").concat(JSON.stringify(formattedResults, null, 2))
                            }
                        ]
                    }];
            case 5: return [4 /*yield*/, notionServer.getPage(args.page_id)];
            case 6:
                pageInfo = _c.sent();
                return [4 /*yield*/, notionServer.getPageContent(args.page_id)];
            case 7:
                pageContent = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Informaci\u00F3n de la p\u00E1gina:\n\n" +
                                    "ID: ".concat(pageInfo.id, "\n") +
                                    "URL: ".concat(pageInfo.url, "\n") +
                                    "\u00DAltima edici\u00F3n: ".concat(pageInfo.last_edited_time, "\n\n") +
                                    "Contenido (".concat(pageContent.length, " bloques):\n") +
                                    JSON.stringify(pageContent, null, 2)
                            }
                        ]
                    }];
            case 8:
                blocks = notionServer.createDocumentationBlocks(args.doc_type, args.content || {});
                return [4 /*yield*/, notionServer.createPage(args.parent_id, args.title, undefined, blocks)];
            case 9:
                newPage = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "P\u00E1gina de documentaci\u00F3n creada:\n\n" +
                                    "ID: ".concat(newPage.id, "\n") +
                                    "URL: ".concat(newPage.url, "\n") +
                                    "Tipo: ".concat(args.doc_type)
                            }
                        ]
                    }];
            case 10: return [4 /*yield*/, notionServer.updatePage(args.page_id, args.properties)];
            case 11:
                updatedPage = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "P\u00E1gina actualizada:\n\n" +
                                    "ID: ".concat(updatedPage.id, "\n") +
                                    "\u00DAltima edici\u00F3n: ".concat(updatedPage.last_edited_time)
                            }
                        ]
                    }];
            case 12: return [4 /*yield*/, notionServer.queryDatabase(args.database_id, args.filters, args.sorts)];
            case 13:
                dbResults = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Resultados de la consulta (".concat(dbResults.length, " elementos):\n\n") +
                                    JSON.stringify(dbResults, null, 2)
                            }
                        ]
                    }];
            case 14:
                block = notionServer.createContentBlock(args.content_type, args.content, args.language);
                return [4 /*yield*/, notionServer.addBlocksToPage(args.page_id, [block])];
            case 15:
                _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Contenido a\u00F1adido a la p\u00E1gina ".concat(args.page_id)
                            }
                        ]
                    }];
            case 16: return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: "Herramienta desconocida: ".concat(name)
                        }
                    ]
                }];
            case 17: return [3 /*break*/, 19];
            case 18:
                error_2 = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error: ".concat(error_2.message)
                            }
                        ]
                    }];
            case 19: return [2 /*return*/];
        }
    });
}); });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    console.error("Notion Documentation MCP Server ejecutándose en stdio");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error("Error fatal:", error);
    process.exit(1);
});
