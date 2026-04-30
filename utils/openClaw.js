const app = getApp()

const AI_CONFIG = {
  providers: {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    claude: {
      name: 'Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    openclaw: {
      name: 'OpenClaw',
      baseUrl: 'https://api.openclaw.example.com/v1',
      models: ['openclaw-travel', 'openclaw-smart']
    }
  },
  defaultProvider: 'openai',
  defaultModel: 'gpt-3.5-turbo'
}

class IntelligentDialogEngine {
  constructor() {
    this.context = {
      userPreferences: {
        interests: [],
        travelStyle: 'balanced',
        budget: 'medium'
      },
      location: null,
      conversationHistory: [],
      currentTask: null,
      pendingQuestions: []
    }
    
    this.intentRecognizer = new IntentRecognizer()
    this.responseGenerator = new ResponseGenerator()
    this.suggestionEngine = new SuggestionEngine()
  }

  setLocation(location) {
    this.context.location = location
  }

  async processMessage(message) {
    const intent = this.intentRecognizer.recognize(message, this.context)
    
    this.context.conversationHistory.push({
      role: 'user',
      content: message,
      intent: intent,
      timestamp: new Date().toISOString()
    })

    const response = await this.responseGenerator.generate(intent, message, this.context)
    
    this.context.conversationHistory.push({
      role: 'assistant',
      content: response.rawContent || response.content,
      timestamp: new Date().toISOString()
    })

    return response
  }

  getSuggestions() {
    return this.suggestionEngine.getSuggestions(this.context)
  }

  clearContext() {
    this.context = {
      userPreferences: {
        interests: [],
        travelStyle: 'balanced',
        budget: 'medium'
      },
      location: null,
      conversationHistory: [],
      currentTask: null,
      pendingQuestions: []
    }
  }
}

class IntentRecognizer {
  constructor() {
    this.patterns = {
      greeting: [
        /^你好|^您好|^hi|^hello|^嗨|^早上好|^下午好|^晚上好/i,
        /^在吗|^有人吗|^在么/i
      ],
      route_planning: [
        /路线|规划|行程|安排|怎么走|怎么去|导航|最优|推荐.*路线/i,
        /从.*到.*|.*到.*怎么走|.*去.*路线/i
      ],
      attraction_search: [
        /景点|好玩的|推荐.*地方|去哪玩|哪里好玩|旅游|游玩|观光|必去/i,
        /景点推荐|周边游|附近.*玩|值得.*去/i
      ],
      food_search: [
        /美食|餐厅|吃饭|好吃的|推荐.*吃|去哪吃|哪里吃|特色菜|小吃|火锅|烧烤/i,
        /饭店|餐馆|吃货|美食推荐/i
      ],
      hotel_search: [
        /酒店|住宿|宾馆|旅馆|民宿|住哪里|推荐.*住|订房|开房/i
      ],
      shopping_search: [
        /购物|商场|商店|买东西|逛街|奢侈品|免税店|特产/i
      ],
      entertainment_search: [
        /娱乐|KTV|酒吧|电影院|游戏|游乐场|乐园|夜生活/i
      ],
      weather_query: [
        /天气|温度|几度|冷不冷|热不热|穿什么|下雨吗|晴天|阴天|刮风/i
      ],
      social_search: [
        /小红书|抖音|微博|热门|网红|打卡|种草|探店|攻略/i,
        /热搜|话题|趋势|流行/i
      ],
      help_query: [
        /帮助|怎么用|功能|你能做什么|帮助|指令|教程/i
      ],
      thanks: [
        /谢谢|感谢|多谢|谢谢你|感谢你/i
      ],
      clear_context: [
        /清空|清除|重新开始|忘记|重置/i
      ],
      config_query: [
        /配置|设置|API|key|密钥|修改.*设置/i
      ]
    }

    this.intentOrder = [
      'clear_context',
      'config_query',
      'greeting',
      'thanks',
      'help_query',
      'route_planning',
      'social_search',
      'attraction_search',
      'food_search',
      'hotel_search',
      'shopping_search',
      'entertainment_search',
      'weather_query'
    ]
  }

  recognize(message, context) {
    for (const intent of this.intentOrder) {
      const patterns = this.patterns[intent]
      if (patterns) {
        for (const pattern of patterns) {
          if (pattern.test(message)) {
            return {
              type: intent,
              confidence: this.calculateConfidence(message, pattern),
              entities: this.extractEntities(message, intent)
            }
          }
        }
      }
    }

    return {
      type: 'general_chat',
      confidence: 0.5,
      entities: {}
    }
  }

  calculateConfidence(message, pattern) {
    const matches = message.match(pattern)
    if (matches) {
      return Math.min(0.95, 0.6 + matches[0].length * 0.02)
    }
    return 0.5
  }

  extractEntities(message, intent) {
    const entities = {}
    
    const numbers = message.match(/\d+/)
    if (numbers) {
      entities.number = parseInt(numbers[0])
    }

    const locationPatterns = [
      /在北京|在上海|在广州|在深圳|在杭州|在成都|在西安|在重庆|在苏州|在南京/,
      /北京|上海|广州|深圳|杭州|成都|西安|重庆|苏州|南京|三亚|厦门|青岛|大连/
    ]
    
    for (const pattern of locationPatterns) {
      const match = message.match(pattern)
      if (match) {
        entities.city = match[0].replace('在', '')
        break
      }
    }

    if (intent === 'route_planning') {
      const fromToMatch = message.match(/从(.+?)到(.+?)(?:怎么走|路线|怎么去|导航|$)/)
      if (fromToMatch) {
        entities.from = fromToMatch[1].trim()
        entities.to = fromToMatch[2].trim()
      }
    }

    const preferenceMatch = message.match(/喜欢|偏好|想要|希望|最好/)
    if (preferenceMatch) {
      entities.hasPreference = true
    }

    return entities
  }
}

class ResponseGenerator {
  constructor() {
    this.responseTemplates = {
      greeting: [
        {
          content: '你好！我是你的AI旅行助手 🤖',
          subContent: '我可以帮你：\n• 🤖 智能对话，解答旅行问题\n• 🗺️ 规划最优旅行路线\n• 🏛️ 推荐周边热门景点\n• 🍽️ 查找当地特色美食\n• 📕 搜索小红书/抖音热门活动\n\n你想了解什么呢？'
        },
        {
          content: '嗨！很高兴为你服务 👋',
          subContent: '我是你的专属旅行顾问。无论是想找景点、规划路线，还是想知道哪里好吃好玩，尽管问我！'
        }
      ],
      thanks: [
        {
          content: '不客气！😊',
          subContent: '能帮到你我很开心。还有什么需要帮助的吗？'
        },
        {
          content: '应该的！很高兴能帮到你 🤗',
          subContent: '如果还有其他问题，随时告诉我。'
        }
      ],
      help_query: [
        {
          content: '我是一个多功能的旅行助手，以下是我能做的事情：',
          subContent: '📍 **位置服务**\n• 查找附近的地铁站、商场、餐厅、酒店等\n• 获取当前位置周边信息\n\n🗺️ **路线规划**\n• 智能规划最优路线\n• 推荐游览顺序\n• 估算时间和距离\n\n🏛️ **景点推荐**\n• 根据位置推荐热门景点\n• 提供景点详细信息\n• 建议游览时间\n\n🍽️ **美食推荐**\n• 当地特色美食\n• 网红餐厅探店\n• 人均价格参考\n\n📕 **社交平台**\n• 小红书热门推荐\n• 抖音打卡地点\n• 热门话题榜单\n\n💡 **使用技巧**\n• 直接说 "帮我找附近的地铁站"\n• 或者说 "推荐北京的景点"\n• 也可以问 "今天天气怎么样"'
        }
      ],
      route_planning: [
        {
          content: '好的，我来帮你规划路线！🗺️',
          subContent: '请告诉我：\n1. 你想去哪些地方？（可以说多个地点）\n2. 你的出行方式是什么？（自驾/公交/步行）\n3. 有没有时间限制？\n\n或者你也可以直接添加地点到路线页面，我会帮你智能排序！',
          type: 'route_plan'
        }
      ],
      social_search: [
        {
          content: '📕 为你搜索社交媒体热门内容...',
          subContent: '我会帮你查找小红书和抖音上的热门打卡地点、美食推荐和游玩攻略！\n\n你想搜索：\n• 📕 小红书热门\n• 🎵 抖音热门\n• 🔥 综合推荐',
          type: 'social'
        }
      ],
      attraction_search: [
        {
          content: '🏛️ 为你推荐热门景点...',
          subContent: '根据你的位置，我来帮你查找值得一去的景点！\n\n你可以告诉我：\n• 你所在的城市\n• 你喜欢的景点类型（历史/自然/现代/文化）\n• 你有多少时间',
          type: 'suggestions'
        }
      ],
      food_search: [
        {
          content: '🍽️ 为你推荐美食...',
          subContent: '民以食为天！让我来帮你找当地好吃的。\n\n你想找：\n• 当地特色菜\n• 网红餐厅\n• 小吃夜市\n• 或者告诉我你的口味偏好？',
          type: 'food'
        }
      ],
      hotel_search: [
        {
          content: '🏨 为你推荐住宿...',
          subContent: '找个舒适的地方休息很重要！\n\n你需要：\n• 什么档次的酒店？（经济型/舒适型/豪华型）\n• 预算大概是多少？\n• 有没有位置偏好？（靠近景点/交通枢纽）',
          type: 'hotel'
        }
      ],
      shopping_search: [
        {
          content: '🛍️ 为你推荐购物地点...',
          subContent: '购物也是旅行的重要部分！\n\n你想逛：\n• 大型商场\n• 特色商业街\n• 奢侈品店\n• 特产商店',
          type: 'shopping'
        }
      ],
      entertainment_search: [
        {
          content: '🎮 为你推荐娱乐活动...',
          subContent: '旅行不只是看风景，还要有乐趣！\n\n你想体验：\n• KTV/酒吧夜生活\n• 电影院/演出\n• 游乐场/主题乐园\n• 或者其他娱乐活动？',
          type: 'entertainment'
        }
      ],
      weather_query: [
        {
          content: '🌤️ 天气信息',
          weather: {
            temp: '22°C',
            condition: '晴朗',
            humidity: '45%',
            wind: '微风',
            suggestion: '天气晴朗，非常适合外出游玩。建议穿着轻薄外套，注意防晒。'
          },
          type: 'weather'
        }
      ],
      clear_context: [
        {
          content: '🗑️ 已清除对话上下文',
          subContent: '我已经忘记了之前的对话内容，让我们重新开始吧！\n\n你想做什么呢？'
        }
      ],
      config_query: [
        {
          content: '⚙️ AI 配置信息',
          subContent: '当前使用模拟智能对话模式。\n\n如果你有 OpenAI API Key 或其他兼容 API，可以在设置中配置，获得更强大的 AI 能力。\n\n**支持的 API 提供商：**\n• OpenAI (GPT-3.5, GPT-4)\n• Claude (Anthropic)\n• OpenClaw 自定义 API\n\n配置后，我将使用真实的 AI 模型进行对话！',
          type: 'config'
        }
      ],
      general_chat: [
        {
          content: '我理解你在说什么。让我想想... 🤔',
          subContent: '我是一个旅行助手，主要帮助你解决旅行相关的问题。\n\n你可以问我：\n• "附近有什么好玩的？"\n• "推荐北京的景点"\n• "帮我规划路线"\n• "搜索小红书热门"\n\n或者直接点击下方的快捷选项！'
        }
      ]
    }
  }

  async generate(intent, message, context) {
    const templates = this.responseTemplates[intent.type] || this.responseTemplates.general_chat
    const template = templates[Math.floor(Math.random() * templates.length)]

    let enhancedResponse = { ...template }

    if (intent.type === 'attraction_search' || intent.type === 'food_search' || 
        intent.type === 'route_planning' || intent.type === 'social_search') {
      enhancedResponse = await this.enhanceWithData(intent, message, context, template)
    }

    enhancedResponse.rawContent = template.content
    enhancedResponse.intent = intent.type

    return enhancedResponse
  }

  async enhanceWithData(intent, message, context, template) {
    const response = { ...template }
    
    if (intent.type === 'attraction_search') {
      response.attractions = [
        { name: '故宫博物院', reason: '中国古代皇家宫殿，世界文化遗产，必游之地', duration: '3-4小时' },
        { name: '景山公园', reason: '俯瞰故宫全景的最佳位置，日落时分最美', duration: '1-2小时' },
        { name: '南锣鼓巷', reason: '老北京胡同文化，特色小店众多，适合拍照', duration: '2-3小时' },
        { name: '北海公园', reason: '保存最完整的古代皇家园林，可划船游湖', duration: '2小时' },
        { name: '恭王府', reason: '一座恭王府，半部清代史，和珅的府邸', duration: '2-3小时' }
      ]
      response.content = '🏛️ 为你推荐以下热门景点：'
      response.subContent = '点击任意景点可以查看详细位置并导航前往。这些都是当地最值得一去的地方！'
    }

    if (intent.type === 'food_search') {
      response.restaurants = [
        { name: '老北京炸酱面', type: '中餐', rating: '4.5', price: '人均¥40' },
        { name: '东来顺火锅', type: '火锅', rating: '4.8', price: '人均¥120' },
        { name: '全聚德烤鸭', type: '北京菜', rating: '4.6', price: '人均¥200' },
        { name: '南门涮肉', type: '火锅', rating: '4.7', price: '人均¥100' },
        { name: '文宇奶酪店', type: '甜品', rating: '4.4', price: '人均¥25' }
      ]
      response.content = '🍽️ 为你推荐以下美食：'
      response.subContent = '这些都是当地人气很高的餐厅，点击可以查看位置。建议提前了解是否需要排队！'
    }

    if (intent.type === 'route_planning') {
      response.routes = [
        {
          name: '经典一日游',
          description: '包含3个主要景点，适合一日游览',
          locations: [
            { name: '故宫博物院', distance: '2.5公里' },
            { name: '景山公园', distance: '步行10分钟' },
            { name: '北海公园', distance: '步行15分钟' }
          ],
          totalTime: '约4-5小时',
          totalDistance: '约5公里'
        },
        {
          name: '文艺探索路线',
          description: '博物馆和艺术画廊的深度体验',
          locations: [
            { name: '国家博物馆', distance: '3公里' },
            { name: '798艺术区', distance: '10公里' },
            { name: '红砖美术馆', distance: '5公里' }
          ],
          totalTime: '约一天',
          totalDistance: '约18公里'
        },
        {
          name: '自然风光路线',
          description: '享受城市中的自然景观',
          locations: [
            { name: '奥林匹克公园', distance: '8公里' },
            { name: '朝阳公园', distance: '5公里' },
            { name: '玉渊潭公园', distance: '3公里' }
          ],
          totalTime: '约3-4小时',
          totalDistance: '约16公里'
        }
      ]
      response.content = '🗺️ 为你推荐以下路线方案：'
      response.subContent = '点击任意路线可以查看详细信息并添加到路线规划中。你也可以告诉我你想去的具体地点，我来帮你优化路线！'
    }

    if (intent.type === 'social_search') {
      response.socialActivities = [
        {
          id: 'social_1',
          platform: 'xiaohongshu',
          platformName: '小红书',
          platformIcon: '📕',
          title: '故宫赏银杏最佳时间',
          content: '每年10月底到11月初是故宫银杏最美的季节，推荐从午门进入，沿中轴线走到御花园，红墙配黄叶超有氛围感！',
          category: '景点',
          tags: ['故宫', '银杏', '拍照打卡'],
          popularity: 98,
          likesFormatted: '12.6k',
          commentsFormatted: '892',
          publishTimeFormatted: '2小时前',
          distance: '2.5km'
        },
        {
          id: 'social_2',
          platform: 'douyin',
          platformName: '抖音',
          platformIcon: '🎵',
          title: '南锣鼓巷隐藏美食攻略',
          content: '别只吃主街的网红店，往胡同里走有惊喜！推荐文宇奶酪店的原味奶酪，还有方砖厂69号炸酱面，本地人都爱去。',
          category: '美食',
          tags: ['南锣鼓巷', '老北京美食', '胡同'],
          popularity: 95,
          likesFormatted: '8.9k',
          commentsFormatted: '654',
          publishTimeFormatted: '5小时前',
          distance: '3km'
        },
        {
          id: 'social_3',
          platform: 'xiaohongshu',
          platformName: '小红书',
          platformIcon: '📕',
          title: '景山公园绝美日落',
          content: '北京看日落的绝佳位置！登上万春亭可以俯瞰整个故宫和中南海，傍晚时分光线柔和，拍照超级出片。',
          category: '自然景观',
          tags: ['日落', '景山', '全景'],
          popularity: 92,
          likesFormatted: '7.7k',
          commentsFormatted: '432',
          publishTimeFormatted: '1天前',
          distance: '2.3km'
        },
        {
          id: 'social_4',
          platform: 'douyin',
          platformName: '抖音',
          platformIcon: '🎵',
          title: '798艺术区拍照指南',
          content: '798真的太好拍了！工业风建筑、涂鸦墙、艺术展览随便拍都好看。推荐周末下午去，光线最好。',
          category: '艺术',
          tags: ['798', '拍照', '艺术展览'],
          popularity: 88,
          likesFormatted: '6.8k',
          commentsFormatted: '567',
          publishTimeFormatted: '2天前',
          distance: '10km'
        }
      ]
      response.content = '🔥 小红书/抖音热门推荐：'
      response.subContent = '这些都是当前社交平台上最热门的打卡地点和美食推荐，点击可以查看详细信息！'
    }

    return response
  }
}

class SuggestionEngine {
  constructor() {
    this.baseSuggestions = [
      '帮我找附近的地铁站',
      '推荐附近的景点',
      '搜索小红书热门',
      '规划一条旅行路线',
      '今天天气怎么样'
    ]
  }

  getSuggestions(context) {
    const suggestions = [...this.baseSuggestions]
    
    if (context.location) {
      suggestions.unshift('查看当前位置附近的推荐')
    }
    
    const history = context.conversationHistory
    if (history.length > 0) {
      const lastUserMessage = history.findLast(m => m.role === 'user')
      if (lastUserMessage) {
        if (lastUserMessage.intent?.type === 'attraction_search') {
          suggestions.push('推荐更多景点')
          suggestions.push('附近的餐厅有哪些')
        }
        if (lastUserMessage.intent?.type === 'food_search') {
          suggestions.push('附近的景点有哪些')
          suggestions.push('推荐当地特色小吃')
        }
        if (lastUserMessage.intent?.type === 'route_planning') {
          suggestions.push('添加更多地点')
          suggestions.push('优化现有路线')
        }
      }
    }

    return suggestions.slice(0, 5)
  }
}

class AIServiceManager {
  constructor() {
    this.dialogEngine = null
    this.apiConfig = null
    this.mode = 'mock'
    
    this.init()
  }

  init() {
    try {
      const savedConfig = wx.getStorageSync('ai_api_config')
      if (savedConfig && savedConfig.apiKey && savedConfig.apiKey.length > 10) {
        this.apiConfig = savedConfig
        this.mode = 'api'
      }
    } catch (error) {
      console.log('读取 AI 配置失败，使用模拟模式:', error)
    }

    this.dialogEngine = new IntelligentDialogEngine()
  }

  setLocation(location) {
    if (this.dialogEngine) {
      this.dialogEngine.setLocation(location)
    }
  }

  async sendMessage(message) {
    if (this.mode === 'api' && this.apiConfig) {
      try {
        return await this.callRealAPI(message)
      } catch (error) {
        console.warn('API 调用失败，切换到模拟模式:', error)
        this.mode = 'mock'
      }
    }

    return await this.dialogEngine.processMessage(message)
  }

  async callRealAPI(message) {
    return new Promise((resolve, reject) => {
      const { provider, apiKey, baseUrl, model } = this.apiConfig
      
      const providerConfig = AI_CONFIG.providers[provider]
      const actualBaseUrl = baseUrl || providerConfig.baseUrl
      const actualModel = model || AI_CONFIG.defaultModel

      wx.request({
        url: `${actualBaseUrl}/chat/completions`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          model: actualModel,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的旅行助手，帮助用户规划路线、推荐景点、查找热门活动。请用简洁、友好的中文回复。'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
            const content = res.data.choices[0].message.content
            resolve({
              type: 'chat',
              content: content,
              rawContent: content,
              fromAPI: true
            })
          } else {
            reject(new Error(`API 错误: ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  configureAPI(config) {
    if (config.apiKey && config.apiKey.length > 10) {
      this.apiConfig = {
        provider: config.provider || AI_CONFIG.defaultProvider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model
      }
      this.mode = 'api'
      
      try {
        wx.setStorageSync('ai_api_config', this.apiConfig)
      } catch (error) {
        console.log('保存 AI 配置失败:', error)
      }
      
      return { success: true, message: 'API 配置已保存' }
    }
    
    return { success: false, message: 'API Key 无效' }
  }

  getCurrentConfig() {
    return {
      mode: this.mode,
      provider: this.apiConfig?.provider || null,
      hasAPIKey: !!this.apiConfig?.apiKey
    }
  }

  clearConfig() {
    this.apiConfig = null
    this.mode = 'mock'
    try {
      wx.removeStorageSync('ai_api_config')
    } catch (error) {
      console.log('清除 AI 配置失败:', error)
    }
    return { success: true, message: '已切换到模拟模式' }
  }

  getSuggestions() {
    return this.dialogEngine.getSuggestions()
  }

  clearContext() {
    if (this.dialogEngine) {
      this.dialogEngine.clearContext()
    }
  }
}

const aiService = new AIServiceManager()

export const initAI = (location) => {
  if (location) {
    aiService.setLocation(location)
  }
}

export const sendMessage = async (message, context = {}) => {
  if (context.location) {
    aiService.setLocation(context.location)
  }
  
  return await aiService.sendMessage(message)
}

export const planRouteWithAI = async (locations, preferences = {}) => {
  const mockPlan = {
    success: true,
    originalCount: locations.length,
    optimizedOrder: locations.map((loc, index) => ({
      ...loc,
      order: index + 1,
      estimatedTime: loc.estimatedTime || 60,
      travelTimeToNext: index < locations.length - 1 ? Math.floor(Math.random() * 30 + 15) : 0
    })),
    summary: {
      totalDistance: (Math.random() * 30 + 10).toFixed(1) + ' 公里',
      totalTime: (locations.length * 60 + locations.length * 20) + ' 分钟',
      travelMode: preferences.travelMode || '自驾',
      suggestions: [
        '建议早上9点出发，避开早高峰',
        '午餐时间可以在路线中间的地点附近用餐',
        '景点之间预留充足的拍照时间'
      ]
    }
  }
  
  return new Promise(resolve => {
    setTimeout(() => resolve(mockPlan), 800)
  })
}

export const getTravelSuggestions = async (location, interests = []) => {
  const mockSuggestions = {
    location: location?.name || '当前位置',
    categories: [
      {
        type: 'attractions',
        title: '必去景点',
        items: [
          { name: '故宫博物院', reason: '中国最大的古代文化艺术博物馆', duration: '3-4小时', distance: '2.5公里' },
          { name: '景山公园', reason: '俯瞰故宫全景的最佳地点', duration: '1-2小时', distance: '2.3公里' },
          { name: '北海公园', reason: '保存最完整的古代皇家园林', duration: '2小时', distance: '3公里' },
          { name: '南锣鼓巷', reason: '老北京胡同文化体验', duration: '2-3小时', distance: '3.5公里' }
        ]
      },
      {
        type: 'food',
        title: '特色美食',
        items: [
          { name: '护国寺小吃', type: '小吃', rating: '4.5', price: '人均¥30' },
          { name: '老北京炸酱面', type: '面食', rating: '4.3', price: '人均¥35' },
          { name: '南门涮肉', type: '火锅', rating: '4.7', price: '人均¥100' }
        ]
      },
      {
        type: 'shopping',
        title: '购物推荐',
        items: [
          { name: '王府井步行街', type: '综合商业', description: '北京最著名的商业街' },
          { name: '三里屯太古里', type: '时尚购物', description: '潮流品牌聚集地' }
        ]
      }
    ]
  }
  
  return new Promise(resolve => {
    setTimeout(() => resolve(mockSuggestions), 600)
  })
}

export const configureAI = (config) => {
  return aiService.configureAPI(config)
}

export const getAIConfig = () => {
  return aiService.getCurrentConfig()
}

export const clearAIConfig = () => {
  return aiService.clearConfig()
}

export const getAIProviders = () => {
  return AI_CONFIG.providers
}

export { aiService }
