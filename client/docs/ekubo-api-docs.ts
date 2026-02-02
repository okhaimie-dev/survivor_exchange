export const EKUBO_API_DOCS = {
    "openapi": "3.1.0",
    "info": {
      "title": "Ekubo API",
      "version": "0.0.1",
      "description": "API for querying data about Ekubo Protocol",
      "contact": {
        "url": "https://ekubo.org",
        "email": "eng@ekubo.org"
      }
    },
    "externalDocs": {
      "url": "https://docs.ekubo.org",
      "description": "Official documentation"
    },
    "components": {
      "schemas": {
  
      },
      "parameters": {
  
      }
    },
    "paths": {
      "/tokens": {
        "get": {
          "tags": [
            "Meta"
          ],
          "summary": "List tokens",
          "description": "Get a list of tokens for the given chain ID",
          "operationId": "get_ListTokens",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "name": "chainId",
              "in": "query"
            },
            {
              "schema": {
                "type": "string",
                "minLength": 1,
                "maxLength": 32,
                "description": "Token symbol search"
              },
              "required": false,
              "description": "Token symbol search",
              "name": "search",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10000,
                "default": 1000
              },
              "required": false,
              "name": "pageSize",
              "in": "query"
            },
            {
              "schema": {
                "type": "string",
                "pattern": "^(?:\\d+|0x[a-fA-F0-9]+):0x[a-fA-F0-9]+$",
                "description": "The :-concatenated chain ID and token address for pagination",
                "example": "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
              },
              "required": false,
              "description": "The :-concatenated chain ID and token address for pagination",
              "name": "afterToken",
              "in": "query"
            },
            {
              "schema": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": -100,
                "maximum": 100
              },
              "required": false,
              "name": "minVisibilityPriority",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "List of tokens",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "chain_id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 100,
                          "description": "Name of the token"
                        },
                        "symbol": {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 32,
                          "description": "Symbol for the token"
                        },
                        "decimals": {
                          "type": "integer",
                          "minimum": 0,
                          "maximum": 78,
                          "description": "The number of decimals used for display of token balances"
                        },
                        "address": {
                          "type": "string",
                          "description": "The address of the token for the specified chain"
                        },
                        "visibility_priority": {
                          "type": "integer",
                          "description": "How much this token should be surfaced relative to other tokens (higher is better)"
                        },
                        "sort_order": {
                          "type": "integer",
                          "description": "How much the token should prefer to be the numerator when displayed in prices (higher is more numerator-like)"
                        },
                        "total_supply": {
                          "type": [
                            "integer",
                            "null"
                          ],
                          "minimum": 0,
                          "description": "The total supply of the token"
                        },
                        "logo_url": {
                          "type": "string",
                          "format": "uri"
                        },
                        "usd_price": {
                          "type": [
                            "number",
                            "null"
                          ],
                          "minimum": 0,
                          "description": "The USD price for one unit of the token"
                        }
                      },
                      "required": [
                        "chain_id",
                        "name",
                        "symbol",
                        "decimals",
                        "address",
                        "visibility_priority",
                        "sort_order",
                        "total_supply",
                        "usd_price"
                      ]
                    },
                    "description": "Array of tokens"
                  }
                }
              }
            }
          }
        }
      },
      "/tokens/batch": {
        "get": {
          "tags": [
            "Meta"
          ],
          "summary": "Batch tokens",
          "description": "Fetch metadata for a specific set of tokens",
          "operationId": "get_BatchGetTokens",
          "parameters": [
            {
              "schema": {
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^(?:\\d+|0x[a-fA-F0-9]+):0x[a-fA-F0-9]+$",
                  "description": "Token identifier formatted as chain_id:token_address where chain_id may be decimal or 0x-prefixed hexadecimal"
                },
                "description": "Repeat the id parameter to fetch multiple tokens (e.g. ?id=1:0x...&id=0x1:0x...)",
                "example": "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
              },
              "required": true,
              "description": "Repeat the id parameter to fetch multiple tokens (e.g. ?id=1:0x...&id=0x1:0x...)",
              "name": "id",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "Tokens",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "chain_id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 100,
                          "description": "Name of the token"
                        },
                        "symbol": {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 32,
                          "description": "Symbol for the token"
                        },
                        "decimals": {
                          "type": "integer",
                          "minimum": 0,
                          "maximum": 78,
                          "description": "The number of decimals used for display of token balances"
                        },
                        "address": {
                          "type": "string",
                          "description": "The address of the token for the specified chain"
                        },
                        "visibility_priority": {
                          "type": "integer",
                          "description": "How much this token should be surfaced relative to other tokens (higher is better)"
                        },
                        "sort_order": {
                          "type": "integer",
                          "description": "How much the token should prefer to be the numerator when displayed in prices (higher is more numerator-like)"
                        },
                        "total_supply": {
                          "type": [
                            "integer",
                            "null"
                          ],
                          "minimum": 0,
                          "description": "The total supply of the token"
                        },
                        "logo_url": {
                          "type": "string",
                          "format": "uri"
                        },
                        "usd_price": {
                          "type": [
                            "number",
                            "null"
                          ],
                          "minimum": 0,
                          "description": "The USD price for one unit of the token"
                        }
                      },
                      "required": [
                        "chain_id",
                        "name",
                        "symbol",
                        "decimals",
                        "address",
                        "visibility_priority",
                        "sort_order",
                        "total_supply",
                        "usd_price"
                      ]
                    },
                    "description": "Array of tokens"
                  }
                }
              }
            }
          }
        }
      },
      "/tokens/{chainId}/{tokenAddress}": {
        "get": {
          "tags": [
            "Meta"
          ],
          "summary": "Get token",
          "description": "Returns metadata for a specific token on the given chain",
          "operationId": "get_GetToken",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenAddress",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "Token information",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "chain_id": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100,
                        "description": "Name of the token"
                      },
                      "symbol": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 32,
                        "description": "Symbol for the token"
                      },
                      "decimals": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 78,
                        "description": "The number of decimals used for display of token balances"
                      },
                      "address": {
                        "type": "string",
                        "description": "The address of the token for the specified chain"
                      },
                      "visibility_priority": {
                        "type": "integer",
                        "description": "How much this token should be surfaced relative to other tokens (higher is better)"
                      },
                      "sort_order": {
                        "type": "integer",
                        "description": "How much the token should prefer to be the numerator when displayed in prices (higher is more numerator-like)"
                      },
                      "total_supply": {
                        "type": [
                          "integer",
                          "null"
                        ],
                        "minimum": 0,
                        "description": "The total supply of the token"
                      },
                      "logo_url": {
                        "type": "string",
                        "format": "uri"
                      },
                      "usd_price": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "minimum": 0,
                        "description": "The USD price for one unit of the token"
                      }
                    },
                    "required": [
                      "chain_id",
                      "name",
                      "symbol",
                      "decimals",
                      "address",
                      "visibility_priority",
                      "sort_order",
                      "total_supply",
                      "usd_price"
                    ]
                  }
                }
              }
            },
            "404": {
              "description": "Token not found",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "status": {
                        "type": "integer",
                        "description": "HTTP status code for the error"
                      },
                      "error": {
                        "type": "string",
                        "description": "Human-readable description of the error"
                      }
                    },
                    "required": [
                      "status",
                      "error"
                    ],
                    "description": "Standard error response payload",
                    "example": {
                      "status": 404,
                      "error": "Token not found"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/blocks/{chainId}/closest": {
        "get": {
          "tags": [
            "Meta"
          ],
          "summary": "Get the block closest to a given timestamp",
          "description": "Returns the block whose timestamp is nearest to the provided timestamp",
          "operationId": "get_GetClosestBlock",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "format": "date-time",
                "description": "Timestamp to find the closest block for in the ISO string format",
                "example": "2025-11-10T00:00:00Z"
              },
              "required": true,
              "description": "Timestamp to find the closest block for in the ISO string format",
              "name": "timestamp",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The block closest to the given timestamp",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "number": {
                        "type": "integer"
                      },
                      "timestamp": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "number",
                      "timestamp"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/blocks/{chainId}/{blockTag}": {
        "get": {
          "tags": [
            "Meta"
          ],
          "summary": "Get block",
          "description": "Get information about a particular block ingested by the API",
          "operationId": "get_GetBlock",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "integer",
                    "minimum": 160000
                  },
                  {
                    "type": "string",
                    "enum": [
                      "latest"
                    ]
                  }
                ],
                "description": "The tag of the block to get or the number of a block containing events"
              },
              "required": true,
              "description": "The tag of the block to get or the number of a block containing events",
              "name": "blockTag",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The timestamp of the given block number",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "number": {
                        "type": "integer"
                      },
                      "timestamp": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "number",
                      "timestamp"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/overview/pairs": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get pairs",
          "description": "Returns stats for the top pairs",
          "operationId": "get_GetOverviewPairs",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "name": "chainId",
              "in": "query"
            },
            {
              "schema": {
                "type": [
                  "number",
                  "null"
                ],
                "minimum": 0,
                "default": 1000,
                "description": "Minimum USD TVL required for a pair to be included"
              },
              "required": false,
              "description": "Minimum USD TVL required for a pair to be included",
              "name": "minTvlUsd",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The stats for the protocols top pairs",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "topPairs": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "token0": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "number"
                                }
                              ]
                            },
                            "token1": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "number"
                                }
                              ]
                            },
                            "volume0_24h": {
                              "type": "string"
                            },
                            "volume1_24h": {
                              "type": "string"
                            },
                            "fees0_24h": {
                              "type": "string"
                            },
                            "fees1_24h": {
                              "type": "string"
                            },
                            "tvl0_total": {
                              "type": "string"
                            },
                            "tvl1_total": {
                              "type": "string"
                            },
                            "tvl0_delta_24h": {
                              "type": "string"
                            },
                            "tvl1_delta_24h": {
                              "type": "string"
                            },
                            "depth0": {
                              "type": "string"
                            },
                            "depth1": {
                              "type": "string"
                            },
                            "min_depth_percent": {
                              "type": [
                                "number",
                                "null"
                              ]
                            }
                          },
                          "required": [
                            "chain_id",
                            "token0",
                            "token1",
                            "volume0_24h",
                            "volume1_24h",
                            "fees0_24h",
                            "fees1_24h",
                            "tvl0_total",
                            "tvl1_total",
                            "tvl0_delta_24h",
                            "tvl1_delta_24h",
                            "depth0",
                            "depth1",
                            "min_depth_percent"
                          ]
                        }
                      }
                    },
                    "required": [
                      "topPairs"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/overview/revenue": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get revenue",
          "description": "Returns the revenue stats for the protocol",
          "operationId": "get_GetOverviewRevenue",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "name": "chainId",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The revenue stats for the protocol",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "revenueByToken": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "revenue": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            }
                          },
                          "required": [
                            "token",
                            "revenue",
                            "chain_id"
                          ]
                        }
                      },
                      "revenueByTokenByDate": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "revenue": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "date": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            }
                          },
                          "required": [
                            "token",
                            "revenue",
                            "chain_id",
                            "date"
                          ]
                        }
                      },
                      "revenueByToken_24h": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "revenue": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            }
                          },
                          "required": [
                            "token",
                            "revenue",
                            "chain_id"
                          ]
                        }
                      }
                    },
                    "required": [
                      "revenueByToken",
                      "revenueByTokenByDate",
                      "revenueByToken_24h"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/overview/tvl": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get TVL",
          "description": "Returns the TVL portion of the overview",
          "operationId": "get_GetOverviewTvl",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "name": "chainId",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The TVL stats",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "tvlByToken": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "balance": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            }
                          },
                          "required": [
                            "token",
                            "balance",
                            "chain_id"
                          ]
                        }
                      },
                      "tvlDeltaByTokenByDate": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "date": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            },
                            "delta": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            }
                          },
                          "required": [
                            "token",
                            "date",
                            "delta",
                            "chain_id"
                          ]
                        }
                      }
                    },
                    "required": [
                      "tvlByToken",
                      "tvlDeltaByTokenByDate"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/overview/volume": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get volume",
          "description": "Returns the volume portion of the overview",
          "operationId": "get_GetOverviewVolume",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "name": "chainId",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The volume stats for the protocol",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "volumeByToken": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "volume": {
                              "type": "string"
                            },
                            "fees": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            }
                          },
                          "required": [
                            "token",
                            "volume",
                            "fees",
                            "chain_id"
                          ]
                        }
                      },
                      "volumeByTokenByDate": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "volume": {
                              "type": "string"
                            },
                            "fees": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "date": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            }
                          },
                          "required": [
                            "token",
                            "volume",
                            "fees",
                            "chain_id",
                            "date"
                          ]
                        }
                      },
                      "volumeByToken_24h": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "volume": {
                              "type": "string"
                            },
                            "fees": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            }
                          },
                          "required": [
                            "token",
                            "volume",
                            "fees",
                            "chain_id"
                          ]
                        }
                      }
                    },
                    "required": [
                      "volumeByToken",
                      "volumeByTokenByDate",
                      "volumeByToken_24h"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/pair/{chainId}/{tokenA}/{tokenB}/tvl": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get pair TVL",
          "description": "Returns TVL stats for the pair",
          "operationId": "get_GetPairInfoTvl",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "Information about the token pair TVL",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "tvlByToken": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "balance": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "token",
                            "balance"
                          ]
                        }
                      },
                      "tvlDeltaByTokenByDate": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "date": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            },
                            "delta": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "token",
                            "date",
                            "delta"
                          ]
                        }
                      }
                    },
                    "required": [
                      "tvlByToken",
                      "tvlDeltaByTokenByDate"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/pair/{chainId}/{tokenA}/{tokenB}/volume": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get pair volume",
          "description": "Returns volume stats for a given trading pair",
          "operationId": "get_GetPairInfoVolume",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "Information about the token pair volume",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "chain_id": {
                        "type": "string"
                      },
                      "volumeByToken": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "volume": {
                              "type": "string"
                            },
                            "fees": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "token",
                            "volume",
                            "fees"
                          ]
                        }
                      },
                      "volumeByTokenByDate": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "volume": {
                              "type": "string"
                            },
                            "fees": {
                              "type": "string"
                            },
                            "date": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            }
                          },
                          "required": [
                            "token",
                            "volume",
                            "fees",
                            "date"
                          ]
                        }
                      },
                      "volumeByToken_24h": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "token": {
                              "type": "string"
                            },
                            "volume": {
                              "type": "string"
                            },
                            "fees": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "token",
                            "volume",
                            "fees"
                          ]
                        }
                      }
                    },
                    "required": [
                      "chain_id",
                      "volumeByToken",
                      "volumeByTokenByDate",
                      "volumeByToken_24h"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/pair/{chainId}/{tokenA}/{tokenB}/pools": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get pools of pair",
          "description": "Returns pool info for a pair",
          "operationId": "get_GetPairInfoPools",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            },
            {
              "schema": {
                "type": [
                  "number",
                  "null"
                ],
                "minimum": 0,
                "default": 1000,
                "description": "Minimum USD TVL required for a pool to be included"
              },
              "required": false,
              "description": "Minimum USD TVL required for a pool to be included",
              "name": "minTvlUsd",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "Information about the pools of a token pair",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "topPools": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "fee": {
                              "type": "string"
                            },
                            "tick_spacing": {
                              "type": "integer"
                            },
                            "core_address": {
                              "type": "string"
                            },
                            "extension": {
                              "type": "string"
                            },
                            "volume0_24h": {
                              "type": "string"
                            },
                            "volume1_24h": {
                              "type": "string"
                            },
                            "fees0_24h": {
                              "type": "string"
                            },
                            "fees1_24h": {
                              "type": "string"
                            },
                            "tvl0_total": {
                              "type": "string"
                            },
                            "tvl1_total": {
                              "type": "string"
                            },
                            "tvl0_delta_24h": {
                              "type": "string"
                            },
                            "tvl1_delta_24h": {
                              "type": "string"
                            },
                            "depth0": {
                              "type": "string"
                            },
                            "depth1": {
                              "type": "string"
                            },
                            "depth_percent": {
                              "type": [
                                "number",
                                "null"
                              ]
                            }
                          },
                          "required": [
                            "fee",
                            "tick_spacing",
                            "core_address",
                            "extension",
                            "volume0_24h",
                            "volume1_24h",
                            "fees0_24h",
                            "fees1_24h",
                            "tvl0_total",
                            "tvl1_total",
                            "tvl0_delta_24h",
                            "tvl1_delta_24h",
                            "depth0",
                            "depth1",
                            "depth_percent"
                          ]
                        }
                      }
                    },
                    "required": [
                      "topPools"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/price/{chainId}/{baseToken}/{quoteToken}/history": {
        "get": {
          "tags": [
            "Prices"
          ],
          "summary": "Get price history",
          "description": "Get the VWAP-based price history for the given pair",
          "operationId": "get_GetPairPriceHistory",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0x0"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "baseToken",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "quoteToken",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric",
                "example": "1"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 60
              },
              "required": false,
              "name": "interval",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The price history of the pair",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "timestamp": {
                        "type": "integer"
                      },
                      "start": {
                        "type": "integer"
                      },
                      "end": {
                        "type": "integer"
                      },
                      "interval": {
                        "type": "integer"
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "start": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            },
                            "vwap": {
                              "type": "number"
                            },
                            "max": {
                              "type": "number"
                            },
                            "min": {
                              "type": "number"
                            },
                            "k_volume": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "start",
                            "vwap",
                            "max",
                            "min",
                            "k_volume"
                          ]
                        }
                      }
                    },
                    "required": [
                      "timestamp",
                      "start",
                      "end",
                      "interval",
                      "data"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/pools/{chainId}/{coreAddress}/{token0}/{token1}/{fee}/{tickSpacing}/{extension}/liquidity": {
        "get": {
          "tags": [
            "Swap"
          ],
          "summary": "Get pool liquidity",
          "description": "Returns the liquidity delta for each tick for the given pool key hash",
          "operationId": "get_GetPoolLiquidity",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0xabcd"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "coreAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0x0000000000000000000000000000000000000000"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "token0",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "token1",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric",
                "example": "1020847100762815390390123822295304634"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "fee",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric",
                "example": "5982"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tickSpacing",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0xabcd"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "extension",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The current liquidity chart for the given pool key hash",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "tick": {
                              "type": "string"
                            },
                            "net_liquidity_delta_diff": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "tick",
                            "net_liquidity_delta_diff"
                          ]
                        }
                      }
                    },
                    "required": [
                      "data"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/tokens/{chainId}/{tokenA}/{tokenB}/liquidity": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get pair liquidity",
          "description": "Returns the liquidity chart for the given token pair, aggregated across all pools",
          "operationId": "get_GetPairLiquidity",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "For each tick for pools of the pair, the liquidity delta",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "tick": {
                              "type": "string"
                            },
                            "net_liquidity_delta_diff": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "tick",
                            "net_liquidity_delta_diff"
                          ]
                        }
                      }
                    },
                    "required": [
                      "data"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/tokens/{chainId}/{tokenA}/{tokenB}/events": {
        "get": {
          "tags": [
            "Stats"
          ],
          "summary": "Get pair events",
          "description": "Returns a list of recent events for the given trading pair",
          "operationId": "get_ListPairEvents",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "A list of events for the given pair",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "type": {
                              "anyOf": [
                                {
                                  "type": "number",
                                  "enum": [0]
                                },
                                {
                                  "type": "number",
                                  "enum": [1]
                                }
                              ]
                            },
                            "fee": {
                              "type": "string"
                            },
                            "tick_spacing": {
                              "type": "integer"
                            },
                            "extension": {
                              "type": "string"
                            },
                            "core_address": {
                              "type": "string"
                            },
                            "locker": {
                              "type": "string"
                            },
                            "timestamp": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "string"
                                }
                              ]
                            },
                            "transaction_hash": {
                              "type": "string"
                            },
                            "delta0": {
                              "type": "string"
                            },
                            "delta1": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type",
                            "fee",
                            "tick_spacing",
                            "extension",
                            "core_address",
                            "locker",
                            "timestamp",
                            "transaction_hash",
                            "delta0",
                            "delta1"
                          ]
                        }
                      }
                    },
                    "required": [
                      "data"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/positions/{address}": {
        "get": {
          "tags": [
            "Positions"
          ],
          "summary": "List positions",
          "description": "Returns the list of position NFTs and their keys",
          "operationId": "get_ListPositionsByAddress",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address for which to list positions",
              "name": "address",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "enum": [
                  "opened",
                  "closed"
                ],
                "description": "Filter positions by state; defaults to returning all positions"
              },
              "required": false,
              "description": "Filter positions by state; defaults to returning all positions",
              "name": "state",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "description": "Restrict results to a specific chain ID",
              "name": "chainId",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 200,
                "default": 50,
                "description": "Maximum number of positions to return per page"
              },
              "required": false,
              "description": "Maximum number of positions to return per page",
              "name": "pageSize",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1,
                "description": "Page number to fetch (1-indexed)"
              },
              "required": false,
              "description": "Page number to fetch (1-indexed)",
              "name": "page",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The position NFTs owned by the address and keys",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "positions_address": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "pool_key": {
                              "type": "object",
                              "properties": {
                                "token0": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "token1": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "fee": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "tick_spacing": {
                                  "type": [
                                    "string",
                                    "null"
                                  ],
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "extension": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                }
                              },
                              "required": [
                                "token0",
                                "token1",
                                "fee",
                                "tick_spacing",
                                "extension"
                              ]
                            },
                            "bounds": {
                              "type": "object",
                              "properties": {
                                "lower": {
                                  "type": "number"
                                },
                                "upper": {
                                  "type": "number"
                                }
                              },
                              "required": [
                                "lower",
                                "upper"
                              ]
                            },
                            "metadata_url": {
                              "type": "string"
                            },
                            "image": {
                              "type": "string"
                            },
                            "liquidity": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "pool_state": {
                              "type": [
                                "object",
                                "null"
                              ],
                              "properties": {
                                "sqrt_ratio": {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                },
                                "tick": {
                                  "type": "integer"
                                },
                                "liquidity": {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              },
                              "required": [
                                "sqrt_ratio",
                                "tick",
                                "liquidity"
                              ]
                            },
                            "rewards": {
                              "type": "object",
                              "additionalProperties": {
                                "type": "object",
                                "properties": {
                                  "amount": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "pending": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  }
                                },
                                "required": [
                                  "amount",
                                  "pending"
                                ]
                              }
                            }
                          },
                          "required": [
                            "id",
                            "chain_id",
                            "positions_address",
                            "pool_key",
                            "bounds",
                            "metadata_url",
                            "image",
                            "liquidity",
                            "pool_state",
                            "rewards"
                          ]
                        }
                      },
                      "pagination": {
                        "type": "object",
                        "properties": {
                          "page": {
                            "type": "integer",
                            "minimum": 1
                          },
                          "pageSize": {
                            "type": "integer",
                            "minimum": 1
                          },
                          "totalPages": {
                            "type": "integer",
                            "minimum": 0
                          },
                          "totalItems": {
                            "type": "integer",
                            "minimum": 0
                          }
                        },
                        "required": [
                          "page",
                          "pageSize",
                          "totalPages",
                          "totalItems"
                        ]
                      }
                    },
                    "required": [
                      "data",
                      "pagination"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/positions/{chainId}/{lockerAddress}/{id}/history": {
        "get": {
          "tags": [
            "Positions"
          ],
          "summary": "List position history",
          "description": "Returns the entire history of the given position ID",
          "operationId": "get_ListPositionNftEvents",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to list events",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the Positions contract",
              "name": "lockerAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The position history",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "chain_id": {
                        "anyOf": [
                          {
                            "type": "string",
                            "pattern": "^0x[a-fA-F0-9]+$",
                            "description": "A hexadecimal number"
                          },
                          {
                            "type": "string",
                            "pattern": "^\\d+e?\\d*$",
                            "description": "A decimal number"
                          }
                        ],
                        "description": "A number represented in hexadecimal or decimal",
                        "title": "Numeric"
                      },
                      "events": {
                        "type": "array",
                        "items": {
                          "anyOf": [
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "transfer"
                                  ]
                                },
                                "block_number": {
                                  "type": "string"
                                },
                                "transaction_hash": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "timestamp": {
                                  "anyOf": [
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "string"
                                    }
                                  ]
                                },
                                "from_address": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "to_address": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                }
                              },
                              "required": [
                                "type",
                                "block_number",
                                "transaction_hash",
                                "timestamp",
                                "from_address",
                                "to_address"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "update"
                                  ]
                                },
                                "block_number": {
                                  "type": "string"
                                },
                                "transaction_hash": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "timestamp": {
                                  "anyOf": [
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "string"
                                    }
                                  ]
                                },
                                "liquidity_delta": {
                                  "type": "string"
                                },
                                "delta0": {
                                  "type": "string"
                                },
                                "delta1": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "block_number",
                                "transaction_hash",
                                "timestamp",
                                "liquidity_delta",
                                "delta0",
                                "delta1"
                              ]
                            },
                            {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "collect_fees"
                                  ]
                                },
                                "block_number": {
                                  "type": "string"
                                },
                                "transaction_hash": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "timestamp": {
                                  "anyOf": [
                                    {
                                      "type": "string"
                                    },
                                    {
                                      "type": "string"
                                    }
                                  ]
                                },
                                "delta0": {
                                  "type": "string"
                                },
                                "delta1": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "block_number",
                                "transaction_hash",
                                "timestamp",
                                "delta0",
                                "delta1"
                              ]
                            }
                          ]
                        }
                      }
                    },
                    "required": [
                      "chain_id",
                      "events"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/positions/{chainId}/{nftAddress}/{id}": {
        "get": {
          "tags": [
            "Positions"
          ],
          "summary": "Get NFT Metadata",
          "description": "Returns the ERC721 metadata for the given position token ID",
          "operationId": "get_GetPositionNftMetadata",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to generate metadata",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the Positions NFT contract",
              "name": "nftAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The NFT metadata for the given position ID",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "description": {
                        "type": "string"
                      },
                      "image": {
                        "type": "string"
                      },
                      "attributes": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "trait_type": {
                              "type": "string"
                            },
                            "value": {
                              "type": [
                                "string",
                                "null"
                              ]
                            }
                          },
                          "required": [
                            "trait_type",
                            "value"
                          ]
                        }
                      }
                    },
                    "required": [
                      "name",
                      "description",
                      "image",
                      "attributes"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/orders/{chainId}/{nftAddress}/{id}/image.svg": {
        "get": {
          "tags": [
            "Orders"
          ],
          "summary": "Get NFT Image",
          "description": "Returns the generated art for the given order NFT ID",
          "operationId": "get_GetOrderNftImage",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the Positions NFT contract",
              "name": "nftAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The order NFT image"
            }
          }
        }
      },
      "/orders/{chainId}/{nftAddress}/{id}": {
        "get": {
          "tags": [
            "Orders"
          ],
          "summary": "Get NFT Metadata",
          "description": "Returns the ERC721 metadata for the given order token ID",
          "operationId": "get_GetOrderNftMetadata",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the Positions NFT contract",
              "name": "nftAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The NFT metadata for the given order ID",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "description": {
                        "type": "string"
                      },
                      "image": {
                        "type": "string"
                      },
                      "attributes": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "trait_type": {
                              "type": "string"
                            },
                            "value": {
                              "type": [
                                "string",
                                "null"
                              ]
                            }
                          },
                          "required": [
                            "trait_type",
                            "value"
                          ]
                        }
                      }
                    },
                    "required": [
                      "name",
                      "description",
                      "image",
                      "attributes"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/twap/pools/{chainId}/{tokenA}/{tokenB}/{fee}": {
        "get": {
          "tags": [
            "TWAP"
          ],
          "summary": "Get TWAP pool",
          "description": "Returns the current state of the given TWAMM pool, including the future order expirations",
          "operationId": "get_GetTwammPoolState",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0x0"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "fee",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The current state of the given TWAMM pool",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "saleRateDeltas": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "time": {
                              "type": "integer",
                              "minimum": 0
                            },
                            "token0SaleRateDelta": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "token1SaleRateDelta": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            }
                          },
                          "required": [
                            "time",
                            "token0SaleRateDelta",
                            "token1SaleRateDelta"
                          ]
                        }
                      }
                    },
                    "required": [
                      "saleRateDeltas"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/twap/pair/{chainId}/{tokenA}/{tokenB}": {
        "get": {
          "tags": [
            "TWAP"
          ],
          "summary": "Get TWAP pair",
          "description": "Returns the current state of the given TWAMM pair, including the future order expirations",
          "operationId": "get_GetTwammPairState",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0x0"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenA",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "tokenB",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The current state of the given TWAMM pair",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "saleRateDeltas": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "time": {
                              "type": "integer",
                              "minimum": 0
                            },
                            "token0SaleRateDelta": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "token1SaleRateDelta": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            }
                          },
                          "required": [
                            "time",
                            "token0SaleRateDelta",
                            "token1SaleRateDelta"
                          ]
                        }
                      }
                    },
                    "required": [
                      "saleRateDeltas"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/twap/orders/{address}": {
        "get": {
          "tags": [
            "TWAP"
          ],
          "summary": "List TWAP orders",
          "description": "Returns the list of TWAP orders currently held by the given address",
          "operationId": "get_ListTwapOrders",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0x1234"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "address",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "enum": [
                  "opened",
                  "closed"
                ],
                "description": "Filter orders by state; defaults to returning all orders"
              },
              "required": false,
              "description": "Filter orders by state; defaults to returning all orders",
              "name": "state",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "description": "Restrict results to a specific chain ID",
              "name": "chainId",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 200,
                "default": 50,
                "description": "Maximum number of TWAP orders to return per page"
              },
              "required": false,
              "description": "Maximum number of TWAP orders to return per page",
              "name": "pageSize",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1,
                "description": "Page number to fetch (1-indexed)"
              },
              "required": false,
              "description": "Page number to fetch (1-indexed)",
              "name": "page",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of TWAP orders placed by the address",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "orders": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "nft_address": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "token_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "orders": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "key": {
                                    "type": "object",
                                    "properties": {
                                      "sell_token": {
                                        "anyOf": [
                                          {
                                            "type": "string",
                                            "pattern": "^0x[a-fA-F0-9]+$",
                                            "description": "A hexadecimal number"
                                          },
                                          {
                                            "type": "string",
                                            "pattern": "^\\d+e?\\d*$",
                                            "description": "A decimal number"
                                          }
                                        ],
                                        "description": "An address on the specified blockchain network",
                                        "title": "Address",
                                        "example": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
                                      },
                                      "buy_token": {
                                        "anyOf": [
                                          {
                                            "type": "string",
                                            "pattern": "^0x[a-fA-F0-9]+$",
                                            "description": "A hexadecimal number"
                                          },
                                          {
                                            "type": "string",
                                            "pattern": "^\\d+e?\\d*$",
                                            "description": "A decimal number"
                                          }
                                        ],
                                        "description": "An address on the specified blockchain network",
                                        "title": "Address",
                                        "example": "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
                                      },
                                      "fee": {
                                        "type": "string",
                                        "example": "1020847100762815411640772995208708096"
                                      },
                                      "start_time": {
                                        "type": "integer",
                                        "minimum": 0,
                                        "description": "The epoch time in seconds at which the order starts"
                                      },
                                      "end_time": {
                                        "type": "integer",
                                        "minimum": 0,
                                        "description": "The epoch time in seconds at which the order ends"
                                      }
                                    },
                                    "required": [
                                      "sell_token",
                                      "buy_token",
                                      "fee",
                                      "start_time",
                                      "end_time"
                                    ],
                                    "description": "The key identifier for a TWAP order in Ekubo"
                                  },
                                  "total_proceeds_withdrawn": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "sale_rate": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "last_collect_proceeds": {
                                    "type": [
                                      "integer",
                                      "null"
                                    ]
                                  },
                                  "total_amount_sold": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  }
                                },
                                "required": [
                                  "key",
                                  "total_proceeds_withdrawn",
                                  "sale_rate",
                                  "last_collect_proceeds",
                                  "total_amount_sold"
                                ]
                              }
                            }
                          },
                          "required": [
                            "chain_id",
                            "nft_address",
                            "token_id",
                            "orders"
                          ]
                        }
                      },
                      "pagination": {
                        "type": "object",
                        "properties": {
                          "page": {
                            "type": "integer",
                            "minimum": 1
                          },
                          "pageSize": {
                            "type": "integer",
                            "minimum": 1
                          },
                          "totalPages": {
                            "type": "integer",
                            "minimum": 0
                          },
                          "totalItems": {
                            "type": "integer",
                            "minimum": 0
                          }
                        },
                        "required": [
                          "page",
                          "pageSize",
                          "totalPages",
                          "totalItems"
                        ]
                      }
                    },
                    "required": [
                      "orders",
                      "pagination"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/limit-orders/orders/{address}": {
        "get": {
          "tags": [
            "Limit Orders"
          ],
          "summary": "List limit orders",
          "description": "Returns the list of limit orders currently held by the given address",
          "operationId": "get_ListLimitOrders",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address",
                "example": "0x1234"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "address",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "enum": [
                  "opened",
                  "closed"
                ],
                "description": "Filter limit orders by state; defaults to returning all orders"
              },
              "required": false,
              "description": "Filter limit orders by state; defaults to returning all orders",
              "name": "state",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "description": "Restrict results to a specific chain ID",
              "name": "chainId",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 200,
                "default": 50,
                "description": "Maximum number of limit orders to return per page"
              },
              "required": false,
              "description": "Maximum number of limit orders to return per page",
              "name": "pageSize",
              "in": "query"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "default": 1,
                "description": "Page number to fetch (1-indexed)"
              },
              "required": false,
              "description": "Page number to fetch (1-indexed)",
              "name": "page",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of limit orders held or previously held by the address",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "orders": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "token_id": {
                              "type": "integer",
                              "minimum": 1
                            },
                            "orders": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "key": {
                                    "type": "object",
                                    "properties": {
                                      "token0": {
                                        "anyOf": [
                                          {
                                            "type": "string",
                                            "pattern": "^0x[a-fA-F0-9]+$",
                                            "description": "A hexadecimal number"
                                          },
                                          {
                                            "type": "string",
                                            "pattern": "^\\d+e?\\d*$",
                                            "description": "A decimal number"
                                          }
                                        ],
                                        "description": "An address on the specified blockchain network",
                                        "title": "Address",
                                        "example": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
                                      },
                                      "token1": {
                                        "anyOf": [
                                          {
                                            "type": "string",
                                            "pattern": "^0x[a-fA-F0-9]+$",
                                            "description": "A hexadecimal number"
                                          },
                                          {
                                            "type": "string",
                                            "pattern": "^\\d+e?\\d*$",
                                            "description": "A decimal number"
                                          }
                                        ],
                                        "description": "An address on the specified blockchain network",
                                        "title": "Address",
                                        "example": "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
                                      },
                                      "tick": {
                                        "type": "number",
                                        "example": 0
                                      }
                                    },
                                    "required": [
                                      "token0",
                                      "token1",
                                      "tick"
                                    ],
                                    "description": "The key identifier for a limit order in Ekubo"
                                  },
                                  "liquidity": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "amount": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "token0_amount_withdrawn": {
                                    "type": [
                                      "string",
                                      "null"
                                    ],
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "token1_amount_withdrawn": {
                                    "type": [
                                      "string",
                                      "null"
                                    ],
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  }
                                },
                                "required": [
                                  "key",
                                  "liquidity",
                                  "amount",
                                  "token0_amount_withdrawn",
                                  "token1_amount_withdrawn"
                                ]
                              }
                            }
                          },
                          "required": [
                            "chain_id",
                            "token_id",
                            "orders"
                          ]
                        },
                        "description": "The list of limit orders owned by the address"
                      },
                      "pagination": {
                        "type": "object",
                        "properties": {
                          "page": {
                            "type": "integer",
                            "minimum": 1
                          },
                          "pageSize": {
                            "type": "integer",
                            "minimum": 1
                          },
                          "totalPages": {
                            "type": "integer",
                            "minimum": 0
                          },
                          "totalItems": {
                            "type": "integer",
                            "minimum": 0
                          }
                        },
                        "required": [
                          "page",
                          "pageSize",
                          "totalPages",
                          "totalItems"
                        ]
                      }
                    },
                    "required": [
                      "orders",
                      "pagination"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/positions/{chainId}/{nftAddress}/{id}/image.svg": {
        "get": {
          "tags": [
            "Positions"
          ],
          "summary": "Get NFT Image",
          "description": "Returns the generated art for the given position NFT ID",
          "operationId": "get_GetPositionNftImage",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the Positions NFT contract",
              "name": "nftAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The position NFT image"
            }
          }
        }
      },
      "/nft/{chainId}/{nftAddress}/{id}": {
        "get": {
          "tags": [
            "Positions"
          ],
          "summary": "Get NFT Metadata",
          "description": "Returns the ERC721 metadata for the given token ID, chain ID and NFT contract address",
          "operationId": "get_GetNftMetadata",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to generate metadata",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the NFT contract",
              "name": "nftAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The NFT metadata for the given position ID"
            }
          }
        }
      },
      "/nft/{chainId}/{nftAddress}/{id}/image.svg": {
        "get": {
          "tags": [
            "Positions"
          ],
          "summary": "Get NFT Image",
          "description": "Returns the generated art for the given position NFT ID",
          "operationId": "get_GetNftImage",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to generate metadata",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address of the NFT contract",
              "name": "nftAddress",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "id",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The position NFT image"
            }
          }
        }
      },
      "/governance/{chainId}/proposals": {
        "get": {
          "tags": [
            "Governance"
          ],
          "summary": "List Proposals",
          "description": "Returns the list of all proposals",
          "operationId": "get_ListProposals",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to list proposals",
              "name": "chainId",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of proposals",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "proposals": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "createdTime": {
                              "type": "integer",
                              "minimum": 0
                            },
                            "description": {
                              "anyOf": [
                                {
                                  "type": "null"
                                },
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "calls": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "to": {
                                    "type": "string",
                                    "pattern": "^0x[a-fA-F0-9]+$",
                                    "description": "A hexadecimal number"
                                  },
                                  "selector": {
                                    "type": "string",
                                    "pattern": "^0x[a-fA-F0-9]+$",
                                    "description": "A hexadecimal number"
                                  },
                                  "calldata": {
                                    "type": "array",
                                    "items": {
                                      "type": "string",
                                      "pattern": "^0x[a-fA-F0-9]+$",
                                      "description": "A hexadecimal number"
                                    }
                                  }
                                },
                                "required": [
                                  "to",
                                  "selector",
                                  "calldata"
                                ]
                              }
                            },
                            "results": {
                              "type": "array",
                              "items": {
                                "type": "array",
                                "items": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                }
                              }
                            },
                            "executed_tx_hash": {
                              "anyOf": [
                                {
                                  "type": "null"
                                },
                                {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            }
                          },
                          "required": [
                            "id",
                            "createdTime",
                            "description",
                            "calls",
                            "results",
                            "executed_tx_hash"
                          ]
                        }
                      }
                    },
                    "required": [
                      "proposals"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/governance/{chainId}/delegates": {
        "get": {
          "tags": [
            "Governance"
          ],
          "summary": "List Top Delegates",
          "description": "Returns the list of top delegates",
          "operationId": "get_ListTopDelegates",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to list top delegates",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 1000
              },
              "required": false,
              "name": "pageSize",
              "in": "query"
            },
            {
              "schema": {
                "type": [
                  "integer",
                  "null"
                ],
                "minimum": 0
              },
              "required": false,
              "name": "start",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of top delegates",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "amountDelegatedTo": {
                        "type": "string",
                        "pattern": "^\\d+e?\\d*$",
                        "description": "A decimal number"
                      },
                      "delegates": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "delegate": {
                              "anyOf": [
                                {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              ],
                              "description": "An address on the specified blockchain network",
                              "title": "Address"
                            },
                            "amount": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "votingRecord": {
                              "type": "object",
                              "properties": {
                                "yea": {
                                  "type": "integer",
                                  "minimum": 0
                                },
                                "nay": {
                                  "type": "integer",
                                  "minimum": 0
                                },
                                "missed": {
                                  "type": "integer",
                                  "minimum": 0
                                }
                              },
                              "required": [
                                "yea",
                                "nay",
                                "missed"
                              ]
                            }
                          },
                          "required": [
                            "delegate",
                            "amount",
                            "votingRecord"
                          ]
                        }
                      }
                    },
                    "required": [
                      "amountDelegatedTo",
                      "delegates"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/governance/{chainId}/proposals/{proposalId}/votes": {
        "get": {
          "tags": [
            "Governance"
          ],
          "summary": "List Votes",
          "description": "Returns the list of votes on a proposal",
          "operationId": "get_ListVotesOnProposal",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to list proposals",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "pattern": "^0x[a-fA-F0-9]+$",
                "description": "The ID of the proposal"
              },
              "required": true,
              "description": "The ID of the proposal",
              "name": "proposalId",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of votes on a specific proposal",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "votes": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "time": {
                              "type": "integer",
                              "minimum": 0
                            },
                            "voter": {
                              "anyOf": [
                                {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              ],
                              "description": "An address on the specified blockchain network",
                              "title": "Address"
                            },
                            "weight": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "yea": {
                              "type": "boolean"
                            }
                          },
                          "required": [
                            "time",
                            "voter",
                            "weight",
                            "yea"
                          ]
                        }
                      }
                    },
                    "required": [
                      "votes"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/governance/{chainId}/proposals/{proposalId}/voters": {
        "get": {
          "tags": [
            "Governance"
          ],
          "summary": "List Voters",
          "description": "Returns the list of voters for a proposal and their votes",
          "operationId": "get_ListProposalVoters",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to list proposals",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "pattern": "^0x[a-fA-F0-9]+$",
                "description": "The ID of the proposal"
              },
              "required": true,
              "description": "The ID of the proposal",
              "name": "proposalId",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of voters and their weights for a specific proposal",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "voters": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "voter": {
                              "anyOf": [
                                {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              ],
                              "description": "An address on the specified blockchain network",
                              "title": "Address"
                            },
                            "weight": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "vote": {
                              "anyOf": [
                                {
                                  "type": "object",
                                  "properties": {
                                    "time": {
                                      "type": "integer",
                                      "minimum": 0
                                    },
                                    "yea": {
                                      "type": "boolean"
                                    }
                                  },
                                  "required": [
                                    "time",
                                    "yea"
                                  ]
                                },
                                {
                                  "type": "null"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            }
                          },
                          "required": [
                            "voter",
                            "weight",
                            "vote"
                          ]
                        }
                      }
                    },
                    "required": [
                      "voters"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/governance/{chainId}/delegates/{address}": {
        "get": {
          "tags": [
            "Governance"
          ],
          "summary": "Get Staker Info",
          "description": "Returns information about a particular staker address: the addresses they have delegated to and the total amount delegated to them",
          "operationId": "get_GetStakerInfo",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "Chain ID for which to look up staker data",
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "The address for which to look up staker data",
              "name": "address",
              "in": "path"
            }
          ],
          "responses": {
            "200": {
              "description": "Information about the given staker",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "amountDelegatedTo": {
                        "type": "string",
                        "pattern": "^\\d+e?\\d*$",
                        "description": "A decimal number"
                      },
                      "delegates": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "delegate": {
                              "anyOf": [
                                {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              ],
                              "description": "An address on the specified blockchain network",
                              "title": "Address"
                            },
                            "amount": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "votingRecord": {
                              "type": "object",
                              "properties": {
                                "yea": {
                                  "type": "integer",
                                  "minimum": 0
                                },
                                "nay": {
                                  "type": "integer",
                                  "minimum": 0
                                },
                                "missed": {
                                  "type": "integer",
                                  "minimum": 0
                                }
                              },
                              "required": [
                                "yea",
                                "nay",
                                "missed"
                              ]
                            }
                          },
                          "required": [
                            "delegate",
                            "amount",
                            "votingRecord"
                          ]
                        }
                      }
                    },
                    "required": [
                      "amountDelegatedTo",
                      "delegates"
                    ]
                  }
                }
              }
            }
          }
        }
      },
      "/campaigns": {
        "get": {
          "tags": [
            "Incentives"
          ],
          "summary": "List campaigns",
          "description": "List all the liquidity incentive campaigns",
          "operationId": "get_ListCampaigns",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "description": "Restrict campaigns to the specified chain ID",
              "name": "chainId",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of campaigns",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "campaigns": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "slug": {
                              "type": "string"
                            },
                            "chain_id": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "name": {
                              "type": "string"
                            },
                            "rewardToken": {
                              "anyOf": [
                                {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              ],
                              "description": "An address on the specified blockchain network",
                              "title": "Address"
                            },
                            "startTime": {
                              "type": "string"
                            },
                            "endTime": {
                              "type": [
                                "string",
                                "null"
                              ]
                            },
                            "nextDropTime": {
                              "type": "string"
                            },
                            "allowedExtensions": {
                              "type": "array",
                              "items": {
                                "anyOf": [
                                  {
                                    "type": "string",
                                    "pattern": "^0x[a-fA-F0-9]+$",
                                    "description": "A hexadecimal number"
                                  },
                                  {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  }
                                ],
                                "description": "An address on the specified blockchain network",
                                "title": "Address"
                              }
                            },
                            "pairs": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "token0": {
                                    "anyOf": [
                                      {
                                        "type": "string",
                                        "pattern": "^0x[a-fA-F0-9]+$",
                                        "description": "A hexadecimal number"
                                      },
                                      {
                                        "type": "string",
                                        "pattern": "^\\d+e?\\d*$",
                                        "description": "A decimal number"
                                      }
                                    ],
                                    "description": "An address on the specified blockchain network",
                                    "title": "Address"
                                  },
                                  "token1": {
                                    "anyOf": [
                                      {
                                        "type": "string",
                                        "pattern": "^0x[a-fA-F0-9]+$",
                                        "description": "A hexadecimal number"
                                      },
                                      {
                                        "type": "string",
                                        "pattern": "^\\d+e?\\d*$",
                                        "description": "A decimal number"
                                      }
                                    ],
                                    "description": "An address on the specified blockchain network",
                                    "title": "Address"
                                  },
                                  "depth_percent": {
                                    "type": [
                                      "number",
                                      "null"
                                    ],
                                    "minimum": 0
                                  },
                                  "depth0": {
                                    "type": [
                                      "string",
                                      "null"
                                    ],
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "depth1": {
                                    "type": [
                                      "string",
                                      "null"
                                    ],
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "distributed": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "scheduled": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "daily_rewards": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "daily_rewards_token0": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "daily_rewards_token1": {
                                    "type": "string",
                                    "pattern": "^\\d+e?\\d*$",
                                    "description": "A decimal number"
                                  },
                                  "realized_volatility": {
                                    "type": [
                                      "number",
                                      "null"
                                    ],
                                    "minimum": 0
                                  }
                                },
                                "required": [
                                  "token0",
                                  "token1",
                                  "depth_percent",
                                  "depth0",
                                  "depth1",
                                  "distributed",
                                  "scheduled",
                                  "daily_rewards",
                                  "daily_rewards_token0",
                                  "daily_rewards_token1",
                                  "realized_volatility"
                                ]
                              }
                            }
                          },
                          "required": [
                            "slug",
                            "chain_id",
                            "name",
                            "rewardToken",
                            "startTime",
                            "endTime",
                            "nextDropTime",
                            "allowedExtensions",
                            "pairs"
                          ]
                        }
                      }
                    },
                    "required": [
                      "campaigns"
                    ],
                    "description": "Response for list campaigns endpoint"
                  }
                }
              }
            }
          }
        }
      },
      "/rewards/{chainId}/{locker}/{salt}": {
        "get": {
          "tags": [
            "Incentives"
          ],
          "summary": "Get position rewards",
          "description": "Returns the computed rewards for a specified position",
          "operationId": "get_ListRewardsForLocker",
          "parameters": [
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": true,
              "name": "chainId",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "locker",
              "in": "path"
            },
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "A number represented in hexadecimal or decimal",
                "title": "Numeric"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "salt",
              "in": "path"
            },
            {
              "schema": {
                "type": "string",
                "format": "date-time",
                "description": "Filter to rewards in periods that started at or after this time"
              },
              "required": false,
              "description": "Filter to rewards in periods that started at or after this time",
              "name": "startTime",
              "in": "query"
            },
            {
              "schema": {
                "type": "string",
                "format": "date-time",
                "description": "Filter to rewards in periods that ended at or before this time"
              },
              "required": false,
              "description": "Filter to rewards in periods that ended at or before this time",
              "name": "endTime",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The computed rewards for each campaign and the specified position",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "rewards": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "campaignSlug": {
                              "type": "string"
                            },
                            "amount": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            },
                            "pending": {
                              "type": "string",
                              "pattern": "^\\d+e?\\d*$",
                              "description": "A decimal number"
                            }
                          },
                          "required": [
                            "campaignSlug",
                            "amount",
                            "pending"
                          ]
                        }
                      }
                    },
                    "required": [
                      "rewards"
                    ],
                    "description": "The list of rewards for a specified position"
                  }
                }
              }
            }
          }
        }
      },
      "/claims/{address}": {
        "get": {
          "tags": [
            "Incentives"
          ],
          "summary": "List available claims",
          "description": "Returns all the claims available for the address",
          "operationId": "get_ListClaimsForAddress",
          "parameters": [
            {
              "schema": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^0x[a-fA-F0-9]+$",
                    "description": "A hexadecimal number"
                  },
                  {
                    "type": "string",
                    "pattern": "^\\d+e?\\d*$",
                    "description": "A decimal number"
                  }
                ],
                "description": "An address on the specified blockchain network",
                "title": "Address"
              },
              "required": true,
              "description": "A hexadecimal number",
              "name": "address",
              "in": "path"
            },
            {
              "schema": {
                "type": "integer",
                "minimum": 1,
                "maximum": 9.223372036854776e+18,
                "format": "int64",
                "description": "The ID of the network that is being fetched",
                "title": "Chain ID"
              },
              "required": false,
              "description": "Restrict claims to the specified chain ID",
              "name": "chainId",
              "in": "query"
            }
          ],
          "responses": {
            "200": {
              "description": "The list of claims for an address",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "claims": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "campaign": {
                              "type": [
                                "string",
                                "null"
                              ]
                            },
                            "chainId": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "dropAddress": {
                              "type": "string",
                              "pattern": "^0x[a-fA-F0-9]+$",
                              "description": "A hexadecimal number"
                            },
                            "key": {
                              "type": "object",
                              "properties": {
                                "owner": {
                                  "anyOf": [
                                    {
                                      "type": "string",
                                      "pattern": "^0x[a-fA-F0-9]+$",
                                      "description": "A hexadecimal number"
                                    },
                                    {
                                      "type": "string",
                                      "pattern": "^\\d+e?\\d*$",
                                      "description": "A decimal number"
                                    },
                                    {
                                      "type": "null"
                                    }
                                  ],
                                  "description": "An address on the specified blockchain network",
                                  "title": "Address"
                                },
                                "token": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                },
                                "root": {
                                  "type": "string",
                                  "pattern": "^0x[a-fA-F0-9]+$",
                                  "description": "A hexadecimal number"
                                }
                              },
                              "required": [
                                "owner",
                                "token",
                                "root"
                              ]
                            },
                            "claim": {
                              "type": "object",
                              "properties": {
                                "index": {
                                  "type": "integer",
                                  "minimum": 0
                                },
                                "account": {
                                  "anyOf": [
                                    {
                                      "type": "string",
                                      "pattern": "^0x[a-fA-F0-9]+$",
                                      "description": "A hexadecimal number"
                                    },
                                    {
                                      "type": "string",
                                      "pattern": "^\\d+e?\\d*$",
                                      "description": "A decimal number"
                                    }
                                  ],
                                  "description": "An address on the specified blockchain network",
                                  "title": "Address"
                                },
                                "amount": {
                                  "type": "string",
                                  "pattern": "^\\d+e?\\d*$",
                                  "description": "A decimal number"
                                }
                              },
                              "required": [
                                "index",
                                "account",
                                "amount"
                              ]
                            },
                            "proof": {
                              "type": "array",
                              "items": {
                                "type": "string",
                                "pattern": "^0x[a-fA-F0-9]+$",
                                "description": "A hexadecimal number"
                              }
                            }
                          },
                          "required": [
                            "campaign",
                            "chainId",
                            "dropAddress",
                            "key",
                            "claim",
                            "proof"
                          ]
                        }
                      }
                    },
                    "required": [
                      "claims"
                    ],
                    "description": "The list of claims for the given address"
                  }
                }
              }
            }
          }
        }
      }
    },
    "webhooks": {
  
    }
}