(() => {
  "use strict";
  const V172_BUILD = "v172 · 2026-10-05 16:18 +08:00";
  const API_SCHEMA = "tianji.api.v1";
  const RPC_SCHEMA = "tianji.jsonrpc.bridge.v1";
  const MCP_SCHEMA = "tianji.mcp.tools.v1";
  const TASK_SCHEMA = "tianji.priority.board.v1";
  const clone = (x) => {
    try {
      return structuredClone(x);
    } catch (_) {
      try {
        return JSON.parse(JSON.stringify(x));
      } catch (__) {
        return x;
      }
    }
  };
  const safe = (fn, fb = null) => {
    try {
      return fn();
    } catch (_) {
      return fb;
    }
  };
  const E = (s) => {
    try {
      return esc(String(s == null ? "" : s));
    } catch (_) {
      return String(s == null ? "" : s).replace(
        /[&<>"']/g,
        (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
      );
    }
  };
  const jsonSafe = (x) => {
    try {
      return JSON.parse(
        JSON.stringify(x, (k, v) =>
          typeof v === "function" ? undefined : typeof v === "bigint" ? String(v) : v,
        ),
      );
    } catch (_) {
      return clone(x);
    }
  };
  class ApiError extends Error {
    constructor(code, message, data) {
      super(message);
      this.name = "TianjiApiError";
      this.code = code;
      this.data = data;
    }
  }
  const PRIORITY = [
    {
      id: "ai",
      p: "P0",
      name: "统一 AI 解释层",
      state: "done",
      note: "v171：Consensus / Explain Schema → 确定性解释 + AI Packet。",
    },
    {
      id: "mcp",
      p: "P0",
      name: "MCP / API 外部调用层",
      state: "done",
      note: "v172：稳定 TianjiAPI、JSON-RPC 2.0 浏览器桥、MCP Tool Manifest、OpenAPI 适配契约。独立 stdio/HTTP 宿主属于部署适配器，不塞进单文件浏览器。",
    },
    {
      id: "kg",
      p: "P0",
      name: "典籍 Evidence / 规则知识图谱",
      state: "doing",
      note: "已有 Evidence Registry、解释图和来源回指；下一步补“原文→规则→算法→字段→结论”的完整图谱。",
    },
    {
      id: "router",
      p: "P0",
      name: "自然语言问事路由",
      state: "todo",
      note: "用户直接描述问题，自动分类事项并选择奇门/六壬/六爻/梅花/择日组合。",
    },
    {
      id: "consumer",
      p: "P0",
      name: "统一消费者结果页 / 报告",
      state: "todo",
      note: "固定为结论→依据→利阻→行动→时间窗→专业证据。",
    },
    {
      id: "qimen-evidence",
      p: "P1",
      name: "奇门四家第三方对拍 / 高级 Evidence",
      state: "todo",
      note: "日家/月家/年家已有古籍口径，第三方逐盘对拍仍欠。",
    },
    {
      id: "liuyao-depth",
      p: "P1",
      name: "六爻完整旺衰 / 卦格 / 应期层",
      state: "todo",
      note: "Core 已成型，完整占断规则尚未封顶。",
    },
    {
      id: "ziwei-depth",
      p: "P1",
      name: "紫微完整飞星体系",
      state: "todo",
      note: "继续补向心/离心自化、来因宫与更完整应期流派。",
    },
    {
      id: "qizheng",
      p: "P1",
      name: "七政四余核心化",
      state: "blocked",
      note: "前置是可靠星历、四余口径与许可证方案。",
    },
    {
      id: "xk",
      p: "P1",
      name: "玄空完整宅盘",
      state: "todo",
      note: "运盘、山星、向星、替卦等尚未形成统一 Core。",
    },
    {
      id: "sanhe",
      p: "P1",
      name: "三合水法 Core",
      state: "todo",
      note: "罗盘已有，水法确定性规则链尚未核心化。",
    },
    {
      id: "tz",
      p: "P2",
      name: "历史时区 / 夏令时自动校正",
      state: "todo",
      note: "真太阳时已有；历史时区数据库仍欠。",
    },
    {
      id: "relation",
      p: "P2",
      name: "关系长期时间轴",
      state: "todo",
      note: "人物库/关系图已有，关系随年份阶段变化尚未产品化。",
    },
    {
      id: "report",
      p: "P2",
      name: "合参 Evidence 正式报告",
      state: "todo",
      note: "将 v169–v172 的 Schema、解释链、AI Packet 与 API provenance 统一成导出模板。",
    },
  ];
  function taskSnapshot() {
    const arr = clone(PRIORITY),
      done = arr.filter((x) => x.state === "done").length,
      doing = arr.filter((x) => x.state === "doing").length,
      total = arr.length;
    return {
      schema: TASK_SCHEMA,
      build: V172_BUILD,
      total,
      done,
      doing,
      progress: +(((done + doing * 0.5) / total) * 100).toFixed(1),
      tasks: arr,
      next: [
        "Evidence 规则知识图谱深化",
        "自然语言问事路由",
        "统一消费者结果页 / 报告",
        "奇门四家第三方对拍 / 高级 Evidence",
      ],
    };
  }
  const METHODS = [
    {
      name: "system.manifest",
      title: "系统清单",
      sensitive: false,
      desc: "返回 Core、Evidence、Consensus、Explain、AI、API 版本与能力摘要。",
    },
    {
      name: "system.health",
      title: "系统自检",
      sensitive: false,
      desc: "返回核心接口可用性、Schema 状态与轻量自检结果。",
    },
    {
      name: "schema.list",
      title: "Schema 列表",
      sensitive: false,
      desc: "返回当前公开的 Tianji Schema 与用途。",
    },
    {
      name: "priority.snapshot",
      title: "任务清单",
      sensitive: false,
      desc: "返回近期紧急重要任务进度。",
    },
    {
      name: "evidence.snapshot",
      title: "Evidence 快照",
      sensitive: false,
      desc: "返回统一 Evidence Registry 快照。",
    },
    {
      name: "evidence.catalog",
      title: "Evidence 目录",
      sensitive: false,
      desc: "返回核心模块成熟度与验证信息。",
    },
    {
      name: "engine.list",
      title: "引擎列表",
      sensitive: false,
      desc: "返回 TianjiCore 已注册计算引擎。",
    },
    {
      name: "engine.run",
      title: "运行指定引擎",
      sensitive: false,
      desc: "显式指定 engineId 与 input，运行确定性 Core。",
    },
    {
      name: "consensus.current",
      title: "当前跨术数合参",
      sensitive: true,
      desc: "读取当前人物/时刻/事项的 Consensus Schema。",
    },
    {
      name: "explain.current",
      title: "当前解释图",
      sensitive: true,
      desc: "读取当前合参的 Explain Graph。",
    },
    {
      name: "ai.explain.current",
      title: "当前 AI 守门解释",
      sensitive: true,
      desc: "返回本地确定性解释报告。",
    },
    {
      name: "ai.packet.current",
      title: "当前 AI Packet",
      sensitive: true,
      desc: "返回供外部模型消费的标准 AI Packet。",
    },
    {
      name: "mcp.manifest",
      title: "MCP Tool Manifest",
      sensitive: false,
      desc: "返回 MCP 适配器工具定义。",
    },
    {
      name: "api.contract",
      title: "API 契约",
      sensitive: false,
      desc: "返回 TianjiAPI / JSON-RPC / OpenAPI 适配契约。",
    },
  ];
  const methodMap = new Map(METHODS.map((x) => [x.name, x]));
  function requireApi(name) {
    const x = window[name];
    if (!x) throw new ApiError(-32010, `${name} 尚不可用`);
    return x;
  }
  function schemas() {
    return [
      { id: "tianji.calculation@1.0.0", layer: "core", owner: "TianjiCore" },
      { id: "tianji.evidence.snapshot.v1", layer: "evidence", owner: "TianjiEvidence" },
      { id: "tianji.consensus.v1", layer: "aggregate", owner: "TianjiConsensus" },
      { id: "tianji.explain.graph.v1", layer: "explain", owner: "TianjiExplainGraph" },
      { id: "tianji.ai.explain.v1", layer: "ai-guard", owner: "TianjiAIExplain" },
      { id: "tianji.ai.packet.v1", layer: "ai-input", owner: "TianjiAIExplain" },
      { id: API_SCHEMA, layer: "external-api", owner: "TianjiAPI" },
      { id: RPC_SCHEMA, layer: "transport", owner: "TianjiBridge" },
      { id: MCP_SCHEMA, layer: "adapter", owner: "TianjiAPI" },
    ];
  }
  function systemManifest() {
    const core = safe(() => window.TianjiCore?.manifest?.(), null),
      ev = safe(() => window.TianjiEvidence?.snapshot?.(), null);
    return {
      schema: "tianji.system.manifest.v1",
      build: V172_BUILD,
      product: "天机玄秘 / 天机盘",
      runtime: "single-file-browser",
      transport: ["direct-js", "json-rpc-2.0-postMessage", "adapter-contract"],
      modules: {
        core: core
          ? {
              version: core.coreVersion,
              schema: core.schemaVersion,
              engines: core.engines?.length || 0,
              sources: core.sources?.length || 0,
            }
          : null,
        evidence: ev ? { schema: ev.schema, modules: ev.modules?.length || 0 } : null,
        consensus: safe(() => window.TianjiConsensus?.manifest?.(), null),
        explain: safe(() => window.TianjiExplainGraph?.manifest?.(), null),
        ai: safe(() => window.TianjiAIExplain?.manifest?.(), null),
        api: { version: "1.0.0", schema: API_SCHEMA, methods: METHODS.length },
      },
      security: {
        postMessage: "disabled-by-default",
        sensitiveMethods: "explicit session enable + per-request consent",
        noNetworkServer: "standalone HTML cannot itself bind stdio/HTTP ports",
      },
    };
  }
  function health() {
    const checks = [];
    const add = (id, ok, detail = "") => checks.push({ id, ok: !!ok, detail });
    add("core", !!window.TianjiCore, "TianjiCore");
    add("evidence", !!window.TianjiEvidence, "TianjiEvidence");
    add("consensus", !!window.TianjiConsensus, "TianjiConsensus");
    add("explain", !!window.TianjiExplainGraph, "TianjiExplainGraph");
    add("ai", !!window.TianjiAIExplain, "TianjiAIExplain");
    const ct = safe(() => window.TianjiCore?.selfTest?.(), null);
    if (ct) add("core.selfTest", !!ct.ok, `${ct.engineCount || 0} engines`);
    const at = safe(() => window.TianjiAIExplain?.selfTest?.(), null);
    if (at) add("ai.selfTest", !!at.ok, `${at.pass || 0}/${at.total || 0}`);
    add("api.methods", METHODS.length >= 12, String(METHODS.length));
    return {
      schema: "tianji.api.health.v1",
      build: V172_BUILD,
      ok: checks.every((x) => x.ok),
      checks,
    };
  }
  function mcpManifest() {
    const obj = {
      schema: MCP_SCHEMA,
      build: V172_BUILD,
      name: "tianji",
      title: "天机盘传统时空计算接口",
      adapterRequired: true,
      notes: [
        "本 HTML 提供稳定 API 与工具描述；标准 MCP stdio/HTTP Server 需由宿主适配器转发至 TianjiAPI.call。",
        "涉及当前人物/占测上下文的工具标为 sensitive，宿主必须取得用户明确授权。",
      ],
      tools: [
        {
          name: "tianji_system_manifest",
          description: "读取天机盘系统、Core 与 Schema 能力清单。",
          apiMethod: "system.manifest",
          sensitive: false,
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
        },
        {
          name: "tianji_system_health",
          description: "运行轻量接口自检。",
          apiMethod: "system.health",
          sensitive: false,
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
        },
        {
          name: "tianji_list_engines",
          description: "列出所有已注册的确定性计算引擎。",
          apiMethod: "engine.list",
          sensitive: false,
          inputSchema: {
            type: "object",
            properties: { system: { type: "string", description: "可选，按 system 过滤" } },
            additionalProperties: false,
          },
        },
        {
          name: "tianji_run_engine",
          description: "按 engineId 运行一个确定性 Core。",
          apiMethod: "engine.run",
          sensitive: false,
          inputSchema: {
            type: "object",
            required: ["engineId", "input"],
            properties: {
              engineId: { type: "string" },
              input: { type: "object" },
              context: { type: "object" },
            },
            additionalProperties: false,
          },
        },
        {
          name: "tianji_evidence_snapshot",
          description: "读取 Evidence Registry 与模块成熟度。",
          apiMethod: "evidence.snapshot",
          sensitive: false,
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
        },
        {
          name: "tianji_priority_snapshot",
          description: "读取近期紧急重要任务清单与完成进度。",
          apiMethod: "priority.snapshot",
          sensitive: false,
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
        },
        {
          name: "tianji_consensus_current",
          description: "读取当前人物、时刻和事项的跨术数合参。",
          apiMethod: "consensus.current",
          sensitive: true,
          inputSchema: {
            type: "object",
            required: ["consent"],
            properties: {
              consent: { type: "boolean", const: true },
              topic: { type: "string" },
              question: { type: "string" },
            },
            additionalProperties: false,
          },
        },
        {
          name: "tianji_explain_current",
          description: "读取当前合参的证据关系图与冲突诊断。",
          apiMethod: "explain.current",
          sensitive: true,
          inputSchema: {
            type: "object",
            required: ["consent"],
            properties: { consent: { type: "boolean", const: true } },
            additionalProperties: false,
          },
        },
        {
          name: "tianji_ai_explain_current",
          description: "读取当前确定性 AI 守门解释报告。",
          apiMethod: "ai.explain.current",
          sensitive: true,
          inputSchema: {
            type: "object",
            required: ["consent"],
            properties: {
              consent: { type: "boolean", const: true },
              mode: { type: "string", enum: ["plain", "pro"] },
            },
            additionalProperties: false,
          },
        },
        {
          name: "tianji_ai_packet_current",
          description: "获取供外部大模型消费的标准 AI Packet。",
          apiMethod: "ai.packet.current",
          sensitive: true,
          inputSchema: {
            type: "object",
            required: ["consent"],
            properties: {
              consent: { type: "boolean", const: true },
              mode: { type: "string", enum: ["plain", "pro"] },
            },
            additionalProperties: false,
          },
        },
      ],
    };
    return clone(obj);
  }
  function openApiSpec() {
    return {
      openapi: "3.1.0",
      info: {
        title: "Tianji JSON-RPC Adapter API",
        version: "1.0.0",
        description: "宿主适配器可将此契约映射为 HTTP POST /rpc；单文件 HTML 本身不监听网络端口。",
      },
      paths: {
        "/rpc": {
          post: {
            summary: "Forward JSON-RPC 2.0 request to TianjiAPI",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["jsonrpc", "method"],
                    properties: {
                      jsonrpc: { const: "2.0" },
                      id: {},
                      method: { type: "string" },
                      params: { type: "object" },
                    },
                  },
                },
              },
            },
            responses: { 200: { description: "JSON-RPC response" } },
          },
        },
      },
      "x-tianji-methods": clone(METHODS),
      "x-mcp-manifest": mcpManifest(),
    };
  }
  function contract() {
    return {
      schema: "tianji.api.contract.v1",
      build: V172_BUILD,
      directJS: {
        global: "window.TianjiAPI",
        example: "await TianjiAPI.call('system.manifest', {})",
      },
      jsonRpc: {
        schema: RPC_SCHEMA,
        request: { jsonrpc: "2.0", id: "demo-1", method: "system.manifest", params: {} },
        postMessage: {
          requestType: "tianji.api.request",
          responseType: "tianji.api.response",
          tokenRequired: true,
          bridgeDisabledByDefault: true,
        },
      },
      mcp: mcpManifest(),
      openapi: openApiSpec(),
    };
  }
  function invoke(name, params = {}) {
    if (!methodMap.has(name))
      throw new ApiError(-32601, "Method not found: " + name, { method: name });
    switch (name) {
      case "system.manifest":
        return systemManifest();
      case "system.health":
        return health();
      case "schema.list":
        return { schema: "tianji.schema.catalog.v1", build: V172_BUILD, schemas: schemas() };
      case "priority.snapshot":
        return taskSnapshot();
      case "evidence.snapshot":
        return requireApi("TianjiEvidence").snapshot();
      case "evidence.catalog":
        return {
          schema: "tianji.evidence.catalog.v1",
          build: V172_BUILD,
          modules: requireApi("TianjiEvidence").catalog(),
        };
      case "engine.list": {
        let a = requireApi("TianjiCore").listEngines();
        if (params.system) a = a.filter((x) => x.system === params.system);
        return { schema: "tianji.engine.catalog.v1", build: V172_BUILD, engines: a };
      }
      case "engine.run": {
        if (!params.engineId) throw new ApiError(-32602, "engineId required");
        return requireApi("TianjiCore").runEngine(
          params.engineId,
          params.input || {},
          params.context || {},
        );
      }
      case "consensus.current":
        return requireApi("TianjiConsensus").build(typeof R !== "undefined" ? R : null, {
          topic: params.topic,
          question: params.question,
        });
      case "explain.current":
        return requireApi("TianjiExplainGraph").build(typeof R !== "undefined" ? R : null);
      case "ai.explain.current":
        return requireApi("TianjiAIExplain").build(typeof R !== "undefined" ? R : null, {
          mode: params.mode || "pro",
        });
      case "ai.packet.current":
        return requireApi("TianjiAIExplain").build(typeof R !== "undefined" ? R : null, {
          mode: params.mode || "pro",
        }).aiPacket;
      case "mcp.manifest":
        return mcpManifest();
      case "api.contract":
        return contract();
    }
  }
  function call(name, params = {}) {
    const started = performance.now();
    const data = invoke(name, params || {});
    return {
      schema: "tianji.api.response.v1",
      build: V172_BUILD,
      method: name,
      generatedAt: new Date().toISOString(),
      data: jsonSafe(data),
      audit: { elapsedMs: +(performance.now() - started).toFixed(3) },
    };
  }
  function rpc(req, opt = {}) {
    const id = req?.id ?? null;
    try {
      if (!req || req.jsonrpc !== "2.0" || typeof req.method !== "string")
        throw new ApiError(-32600, "Invalid Request");
      const meta = methodMap.get(req.method);
      if (!meta) throw new ApiError(-32601, "Method not found: " + req.method);
      if (opt.bridge && meta.sensitive && !(opt.allowSensitive && req.params?.consent === true))
        throw new ApiError(
          -32030,
          "Sensitive method requires enabled session permission and params.consent=true",
          { method: req.method },
        );
      return { jsonrpc: "2.0", id, result: call(req.method, req.params || {}) };
    } catch (e) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: Number.isFinite(e.code) ? e.code : -32603,
          message: e.message || String(e),
          data: jsonSafe(e.data || null),
        },
      };
    }
  }
  const BRIDGE = { enabled: false, allowSensitive: false, token: "" };
  function token() {
    try {
      return crypto.randomUUID();
    } catch (_) {
      return "tj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    }
  }
  function bridgeEnable(allowSensitive = false) {
    BRIDGE.enabled = true;
    BRIDGE.allowSensitive = !!allowSensitive;
    BRIDGE.token = token();
    renderBridgeState();
    return {
      schema: RPC_SCHEMA,
      enabled: true,
      allowSensitive: BRIDGE.allowSensitive,
      token: BRIDGE.token,
    };
  }
  function bridgeDisable() {
    BRIDGE.enabled = false;
    BRIDGE.allowSensitive = false;
    BRIDGE.token = "";
    renderBridgeState();
    return { schema: RPC_SCHEMA, enabled: false };
  }
  window.addEventListener("message", (e) => {
    try {
      const d = e.data;
      if (!BRIDGE.enabled || !d || d.type !== "tianji.api.request" || d.token !== BRIDGE.token)
        return;
      const response = rpc(d.request, { bridge: true, allowSensitive: BRIDGE.allowSensitive });
      if (e.source && typeof e.source.postMessage === "function")
        e.source.postMessage({ type: "tianji.api.response", token: BRIDGE.token, response }, "*");
    } catch (_) {}
  });
  function selfTest() {
    const c = [];
    const add = (n, ok, d = "") => c.push({ n, ok: !!ok, d });
    try {
      add("API schema", API_SCHEMA === "tianji.api.v1", API_SCHEMA);
      add("method registry", METHODS.length >= 14, String(METHODS.length));
      const m = call("system.manifest", {});
      add(
        "system.manifest",
        m.data?.modules?.api?.methods === METHODS.length,
        String(m.data?.modules?.api?.methods),
      );
      const h = call("system.health", {});
      add("system.health", !!h.data?.ok, String(h.data?.checks?.length || 0));
      const mc = call("mcp.manifest", {});
      add("MCP manifest", mc.data?.tools?.length >= 8, String(mc.data?.tools?.length || 0));
      const cr = call("api.contract", {});
      add("OpenAPI 3.1", cr.data?.openapi?.openapi === "3.1.0", cr.data?.openapi?.openapi || "—");
      const bad = rpc({ jsonrpc: "2.0", id: 1, method: "no.such.method", params: {} });
      add("JSON-RPC error", bad.error?.code === -32601, String(bad.error?.code));
      const deny = rpc(
        { jsonrpc: "2.0", id: 2, method: "consensus.current", params: { consent: true } },
        { bridge: true, allowSensitive: false },
      );
      add("敏感调用守门", deny.error?.code === -32030, String(deny.error?.code));
    } catch (e) {
      add("exception", false, e.message || String(e));
    }
    return {
      ok: c.every((x) => x.ok),
      checks: c,
      pass: c.filter((x) => x.ok).length,
      total: c.length,
    };
  }
  function methodsHTML() {
    return METHODS.map(
      (x) =>
        `<div class="tj172-method"><b>${E(x.name)}</b><small>${E(x.desc)}</small><small class="${x.sensitive ? "sens" : "pub"}">${x.sensitive ? "敏感上下文 · 外部桥需授权" : "公共/显式输入"}</small></div>`,
    ).join("");
  }
  function bridgeHTML() {
    return `<div class="tj172-bridge"><div><b>JSON-RPC postMessage Bridge</b><small>默认关闭。开启后生成一次性会话 Token；涉及当前人物/占测的敏感方法还必须勾选授权并在请求中传 consent:true。</small><div class="tj172-token" id="tj172Token">${BRIDGE.enabled ? E(BRIDGE.token) : "未开启"}</div></div><div><label style="display:block;color:var(--dim);font-size:9px;margin-bottom:5px"><input id="tj172Sensitive" type="checkbox"${BRIDGE.allowSensitive ? " checked" : ""}> 允许敏感上下文</label><button class="gbtn sm" id="tj172Bridge">${BRIDGE.enabled ? "关闭桥接" : "开启桥接"}</button></div></div>`;
  }
  function panel() {
    const H = selfTest(),
      M = METHODS.length,
      MC = mcpManifest(),
      C = window.TianjiCore?.listEngines?.().length || 0,
      schemasN = schemas().length;
    return `<div class="tj172"><section class="tj172-hero"><div class="tj172-head"><div><h3>Tianji API Gateway 1.0 · MCP / API 外部调用层</h3><p>把此前分散在 window.TianjiCore、Evidence、Consensus、Explain Graph 与 AI Explain 的能力统一成稳定调用契约。浏览器内可直接使用 <code>window.TianjiAPI</code>；跨页面可选 JSON-RPC 2.0 postMessage Bridge；MCP / HTTP 宿主按同一 Tool Manifest 与 OpenAPI 契约转发。</p></div><div class="tj172-badges"><span class="tj172-badge">${API_SCHEMA}</span><span class="tj172-badge">${RPC_SCHEMA}</span><span class="tj172-badge">${MCP_SCHEMA}</span></div></div><div class="tj172-toolbar"><button class="gbtn sm" id="tj172CopyContract">复制 API Contract</button><button class="gbtn sm" id="tj172CopyMcp">复制 MCP Tool Manifest</button><button class="gbtn sm" id="tj172CopyOpenApi">复制 OpenAPI 3.1</button><button class="gbtn sm" id="tj172RunTest">重新自检</button></div></section><div class="tj172-kpis"><div class="tj172-kpi"><small>公开方法</small><b>${M}</b></div><div class="tj172-kpi"><small>MCP Tools</small><b>${MC.tools.length}</b></div><div class="tj172-kpi"><small>Core Engines</small><b>${C}</b></div><div class="tj172-kpi"><small>Schema</small><b>${schemasN}</b></div><div class="tj172-kpi"><small>Gateway 自检</small><b style="color:${H.ok ? "var(--good)" : "var(--bad)"}">${H.pass}/${H.total}</b></div></div><div class="tj172-grid"><section class="tj172-card"><h4>公开方法目录</h4><div class="tj172-methods">${methodsHTML()}</div></section><section class="tj172-card"><h4>调用测试台</h4><div class="tj172-console"><div class="tj172-row"><select id="tj172Method">${METHODS.map((x) => `<option value="${x.name}">${x.name}</option>`).join("")}</select><textarea id="tj172Params">{}</textarea></div><button class="gbtn sm" id="tj172Invoke">调用 TianjiAPI.call()</button><textarea class="out" id="tj172Out" readonly>${E(JSON.stringify(H, null, 2))}</textarea>${bridgeHTML()}</div></section></div><section class="tj172-card"><h4>接口边界</h4><p><b style="color:var(--gold2)">这不是伪装成服务器：</b>独立 HTML 不能自行监听 stdio 或 HTTP 端口，因此 v172 完成的是稳定 API、JSON-RPC 浏览器桥、MCP Tool Manifest 与 OpenAPI 适配契约。真正的 MCP Server 由桌面宿主、Node/Python 适配器或 WebView 宿主转发；算法与 Schema 不需要因此再改一套。</p><p>对当前人物、当前占测和合参结果的访问属于上下文敏感能力。postMessage Bridge 默认关闭，而且敏感方法要求“会话授权 + 每次请求 consent:true”双重条件。</p></section></div>`;
  }
  function copyText(t, msg) {
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(() => toast(msg));
      else toast("当前浏览器不支持直接复制");
    } catch (_) {}
  }
  function renderBridgeState() {
    const tok = document.getElementById("tj172Token"),
      btn = document.getElementById("tj172Bridge"),
      ck = document.getElementById("tj172Sensitive");
    if (tok) tok.textContent = BRIDGE.enabled ? BRIDGE.token : "未开启";
    if (btn) btn.textContent = BRIDGE.enabled ? "关闭桥接" : "开启桥接";
    if (ck) ck.checked = BRIDGE.allowSensitive;
  }
  function bindPanel() {
    const inv = document.getElementById("tj172Invoke");
    if (inv)
      inv.onclick = () => {
        const out = document.getElementById("tj172Out");
        try {
          const m = document.getElementById("tj172Method").value,
            p = JSON.parse(document.getElementById("tj172Params").value || "{}");
          out.value = JSON.stringify(call(m, p), null, 2);
        } catch (e) {
          out.value = JSON.stringify(
            { error: e.message || String(e), code: e.code || -32603 },
            null,
            2,
          );
        }
      };
    const rt = document.getElementById("tj172RunTest");
    if (rt)
      rt.onclick = () => {
        const out = document.getElementById("tj172Out");
        if (out) out.value = JSON.stringify(selfTest(), null, 2);
      };
    const cc = document.getElementById("tj172CopyContract");
    if (cc) cc.onclick = () => copyText(JSON.stringify(contract(), null, 2), "已复制 API Contract");
    const cm = document.getElementById("tj172CopyMcp");
    if (cm)
      cm.onclick = () =>
        copyText(JSON.stringify(mcpManifest(), null, 2), "已复制 MCP Tool Manifest");
    const co = document.getElementById("tj172CopyOpenApi");
    if (co)
      co.onclick = () => copyText(JSON.stringify(openApiSpec(), null, 2), "已复制 OpenAPI 3.1");
    const br = document.getElementById("tj172Bridge");
    if (br)
      br.onclick = () =>
        BRIDGE.enabled
          ? bridgeDisable()
          : bridgeEnable(!!document.getElementById("tj172Sensitive")?.checked);
    const ck = document.getElementById("tj172Sensitive");
    if (ck)
      ck.onchange = () => {
        BRIDGE.allowSensitive = !!ck.checked;
        if (BRIDGE.enabled) BRIDGE.token = token();
        renderBridgeState();
      };
  }
  function mount() {
    const anchor = document.querySelector(".tj171") || document.querySelector(".tj170");
    if (!anchor || document.querySelector(".tj172")) return;
    anchor.insertAdjacentHTML("afterend", panel());
    bindPanel();
  }
  function taskHTML() {
    const S = taskSnapshot(),
      grp = (p) => S.tasks.filter((x) => x.p === p),
      label = { done: "完成", doing: "进行中", todo: "待办", blocked: "前置阻塞" };
    return `<div class="tj172-taskboard"><section class="tj172-taskhero"><div class="tj172-taskhead"><div><h3>近期紧急重要任务清单 · v172</h3><p>本清单随主工程版本更新。v172 已完成外部 API 契约层，下一焦点转向 Evidence 规则知识图谱。</p></div><div class="tj172-progress"><div class="tj172-progressbar"><i style="width:${S.progress}%"></i></div><small>进度 ${S.progress}% · 完成 ${S.done}/${S.total} · 进行中 ${S.doing}</small></div></div></section><div class="tj172-taskgrid">${[
      "P0",
      "P1",
      "P2",
    ]
      .map(
        (p) =>
          `<section class="tj172-taskcol"><h4>${p} · ${p === "P0" ? "紧急重要" : p === "P1" ? "重要主线" : "后续完善"}</h4>${grp(
            p,
          )
            .map(
              (x) =>
                `<div class="tj172-task ${x.state}"><span class="st">${label[x.state]}</span><div><b>${E(x.name)}</b><small>${E(x.note)}</small></div></div>`,
            )
            .join("")}</section>`,
      )
      .join("")}</div></div>`;
  }
  function patchVerify() {
    try {
      if (!window.REF_PANES || typeof REF_PANES.verify !== "function" || REF_PANES.verify.__v172)
        return;
      const old = REF_PANES.verify;
      const fn = () => taskHTML() + old();
      fn.__v172 = true;
      REF_PANES.verify = fn;
    } catch (e) {
      console.warn("[v172 task board]", e);
    }
  }
  const API = Object.freeze({
    version: "1.0.0",
    build: V172_BUILD,
    schema: API_SCHEMA,
    listMethods: () => clone(METHODS),
    call,
    rpc,
    systemManifest,
    health,
    schemas,
    mcpManifest,
    openApiSpec,
    contract,
    selfTest,
  });
  window.TianjiAPI = API;
  window.TianjiBridge = Object.freeze({
    schema: RPC_SCHEMA,
    status: () => clone(BRIDGE),
    enable: bridgeEnable,
    disable: bridgeDisable,
  });
  window.TianjiPriorityBoard = Object.freeze({ schema: TASK_SCHEMA, snapshot: taskSnapshot });
  try {
    if (window.TianjiCore) {
      TianjiCore.registerSource({
        id: "tianji-v172-api-gateway",
        type: "internal",
        title: "Tianji API Gateway 1.0",
        version: "1.0.0",
        baseline: "v171",
      });
      TianjiCore.registerEngine(
        {
          id: "api.gateway.selftest.v1",
          system: "system",
          name: "Tianji API Gateway SelfTest",
          version: "1.0.0",
          source: "tianji-v172-api-gateway",
          doctrine: "stable API contract · JSON-RPC bridge · MCP adapter manifest",
          status: "active",
        },
        () => API.selfTest(),
      );
    }
  } catch (e) {
    console.warn("[v172 registry]", e);
  }
  try {
    const old = REF_BIND.over;
    REF_BIND.over = () => {
      try {
        old && old();
      } catch (_) {}
      try {
        mount();
      } catch (e) {
        console.warn("[v172 mount]", e);
      }
    };
  } catch (_) {}
  patchVerify();
  setTimeout(() => {
    try {
      if (document.querySelector(".tj171") || document.querySelector(".tj170")) mount();
    } catch (_) {}
  }, 0);
  try {
    const road = window.TianjiRoadmap || {};
    window.TianjiRoadmap = Object.freeze(
      Object.assign({}, road, {
        urgentImportant: taskSnapshot(),
        nextMainline: [
          "Evidence 规则知识图谱深化",
          "自然语言问事路由",
          "统一消费者结果页 / 报告",
          "奇门四家第三方对拍与高级 Evidence",
        ],
      }),
    );
  } catch (_) {}
  try {
    const T = selfTest(),
      bv = document.getElementById("buildVersion");

    window.TianjiSystemV172 = {
      version: "v172",
      build: V172_BUILD,
      apiSchema: API_SCHEMA,
      rpcSchema: RPC_SCHEMA,
      mcpSchema: MCP_SCHEMA,
      selfTest: T,
    };
    window.dispatchEvent(
      new CustomEvent("tianji:api-ready", {
        detail: { version: "1.0.0", build: V172_BUILD, schema: API_SCHEMA },
      }),
    );
  } catch (_) {}
})();
