export const loggerEsTemplate = {
    priority: 300,
    index_patterns: ["wt_logs_*"],
    data_stream: {},
    composed_of: [],
    template: {
        settings: {
            index: {
                lifecycle: {
                    name: "logs"
                },
                codec: "best_compression",
                query: {
                    default_field: ["message"]
                },
                mapping: {
                    total_fields: {
                        limit: "3000"
                    }
                },
                number_of_shards: "3",
                number_of_replicas: "0"
            }
        },
        mappings: {
            dynamic_templates: [
                {
                    strings_as_keyword: {
                        match_mapping_type: "string",
                        mapping: {
                            ignore_above: 2048,
                            type: "keyword"
                        }
                    }
                }
            ],
            date_detection: false,
            properties: {
                "@timestamp": {
                    type: "date"
                },
                message: {
                    index: true,
                    type: "text"
                },
                level: {
                    index: true,
                    type: "keyword"
                },
                label: {
                    index: true,
                    type: "keyword"
                },
                meta: {
                    dynamic: true,
                    type: "object",
                    properties: {
                        ip: {
                            type: "ip"
                        },
                        path: {
                            type: "keyword"
                        },
                        client: {
                            type: "keyword"
                        },
                        referer: {
                            type: "text"
                        },
                        ua: {
                            type: "text"
                        },
                        url: {
                            type: "text"
                        },
                        error: {
                            type: "text"
                        },
                        stack: {
                            type: "text"
                        },
                        teamId: {
                            type: "keyword"
                        },
                        uid: {
                            type: "keyword"
                        },
                        ext: {
                            type: "text"
                        }
                    }
                }
            }
        }
    }
};
