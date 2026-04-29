const app = getApp()
import { getCurrentLocation, calculateDistance, formatDistance } from '../../utils/location.js'
import { searchPlaces, searchNearby } from '../../utils/api.js'

Page({
  data: {
    currentLocation: null,
    searchKeyword: '',
    searchType: 'place',
    searchResults: [],
    searchHistory: [],
    hotSearches: [
      { id: 1, name: '便利店' },
      { id: 2, name: '地铁站' },
      { id: 3, name: '商场' },
      { id: 4, name: '公园' },
      { id: 5, name: '餐厅' },
      { id: 6, name: '酒店' },
      { id: 7, name: '景点' },
      { id: 8, name: '博物馆' }
    ],
    categorySearches: [
      { id: 'concentration', name: '密度搜索', desc: '搜索某类地点最集中的区域', icon: '📍' },
      { id: 'route', name: '路线搜索', desc: '搜索经过某类地点最多的路线', icon: '🛣️' }
    ],
    concentrationResults: [],
    isSearching: false,
    showResults: false,
    selectedCategory: null,
    searchRadius: 5000
  },

  onLoad(options) {
    this.initPage(options)
  },

  async initPage(options) {
    try {
      const location = await getCurrentLocation()
      this.setData({
        currentLocation: location
      })
    } catch (error) {
      console.error('获取位置失败:', error)
    }
    
    this.loadSearchHistory()
    
    if (options.keyword) {
      const keyword = decodeURIComponent(options.keyword)
      this.setData({
        searchKeyword: keyword
      })
      this.doSearch()
    }
  },

  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || []
      this.setData({
        searchHistory: history.slice(0, 10)
      })
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  },

  saveToHistory(keyword) {
    if (!keyword) return
    
    try {
      let history = wx.getStorageSync('searchHistory') || []
      
      history = history.filter(item => item !== keyword)
      
      history.unshift(keyword)
      
      history = history.slice(0, 20)
      
      wx.setStorageSync('searchHistory', history)
      
      this.setData({
        searchHistory: history.slice(0, 10)
      })
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  onSearchConfirm() {
    if (!this.data.searchKeyword) {
      app.showToast('请输入搜索内容')
      return
    }
    
    this.doSearch()
  },

  onSearchTypeChange(e) {
    const { type } = e.currentTarget.dataset
    this.setData({
      searchType: type
    })
  },

  onTapHotSearch(e) {
    const { name } = e.currentTarget.dataset
    this.setData({
      searchKeyword: name
    })
    this.doSearch()
  },

  onTapHistory(e) {
    const { keyword } = e.currentTarget.dataset
    this.setData({
      searchKeyword: keyword
    })
    this.doSearch()
  },

  onTapCategorySearch(e) {
    const { id } = e.currentTarget.dataset
    this.setData({
      selectedCategory: id,
      searchType: id
    })
  },

  async doSearch() {
    const { searchKeyword, searchType, currentLocation, searchRadius } = this.data
    
    if (!searchKeyword) {
      app.showToast('请输入搜索内容')
      return
    }
    
    this.saveToHistory(searchKeyword)
    
    app.showLoading('搜索中...')
    this.setData({
      isSearching: true
    })
    
    try {
      let results
      
      if (searchType === 'concentration') {
        results = await this.searchByConcentration(searchKeyword, currentLocation, searchRadius)
        this.setData({
          concentrationResults: results,
          showResults: true,
          isSearching: false
        })
      } else {
        results = await searchPlaces(searchKeyword, currentLocation, searchRadius)
        
        results = results.map(item => ({
          ...item,
          distanceText: item.distance ? formatDistance(item.distance) : null
        }))
        
        this.setData({
          searchResults: results,
          showResults: true,
          isSearching: false
        })
      }
      
      app.hideLoading()
    } catch (error) {
      console.error('搜索失败:', error)
      app.hideLoading()
      app.showToast('搜索失败')
      this.setData({
        isSearching: false
      })
    }
  },

  async searchByConcentration(keyword, location, radius) {
    return new Promise((resolve) => {
      const mockAreas = this.generateMockConcentrationAreas(keyword, location, radius)
      setTimeout(() => {
        resolve(mockAreas)
      }, 800)
    })
  },

  generateMockConcentrationAreas(keyword, location, radius) {
    const areas = []
    const baseLat = location?.latitude || 39.9042
    const baseLon = location?.longitude || 116.4074
    
    const streetNames = [
      '建国路', '长安街', '三里屯路', '国贸路', '中关村大街',
      '望京路', '朝阳路', '建国门外大街', '复兴路', '知春路'
    ]
    
    for (let i = 0; i < 8; i++) {
      const count = Math.floor(Math.random() * 20) + 5
      const distance = Math.random() * (radius / 1000)
      
      areas.push({
        id: `area_${Date.now()}_${i}`,
        name: streetNames[i % streetNames.length],
        keyword: keyword,
        count: count,
        density: `${count}个/平方公里`,
        distance: distance,
        distanceText: formatDistance(distance),
        latitude: baseLat + (Math.random() - 0.5) * 0.05,
        longitude: baseLon + (Math.random() - 0.5) * 0.05,
        hotSpots: this.generateHotSpots(count, baseLat, baseLon)
      })
    }
    
    return areas.sort((a, b) => b.count - a.count)
  },

  generateHotSpots(count, baseLat, baseLon) {
    const spots = []
    const maxSpots = Math.min(count, 5)
    
    for (let i = 0; i < maxSpots; i++) {
      spots.push({
        id: `spot_${Date.now()}_${i}`,
        name: `热点${i + 1}`,
        latitude: baseLat + (Math.random() - 0.5) * 0.01,
        longitude: baseLon + (Math.random() - 0.5) * 0.01,
        category: '便利店'
      })
    }
    
    return spots
  },

  onTapResult(e) {
    const { result } = e.currentTarget.dataset
    if (!result) return
    
    wx.navigateTo({
      url: `/pages/map/map?latitude=${result.latitude}&longitude=${result.longitude}&name=${encodeURIComponent(result.name)}&address=${encodeURIComponent(result.address || '')}`
    })
  },

  onTapArea(e) {
    const { area } = e.currentTarget.dataset
    if (!area) return
    
    const markers = area.hotSpots.map((spot, index) => ({
      latitude: spot.latitude,
      longitude: spot.longitude,
      name: spot.name || `${area.keyword}${index + 1}`,
      address: area.name
    }))
    
    const markersParam = encodeURIComponent(JSON.stringify(markers))
    
    wx.navigateTo({
      url: `/pages/map/map?markers=${markersParam}&centerLat=${area.latitude}&centerLng=${area.longitude}`
    })
  },

  onClearHistory() {
    if (this.data.searchHistory.length === 0) return
    
    wx.showModal({
      title: '确认清除',
      content: '确定要清除搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('searchHistory')
            this.setData({
              searchHistory: []
            })
            app.showToast('已清除')
          } catch (error) {
            console.error('清除搜索历史失败:', error)
          }
        }
      }
    })
  },

  onClearSearch() {
    this.setData({
      searchKeyword: '',
      searchResults: [],
      concentrationResults: [],
      showResults: false,
      selectedCategory: null
    })
  },

  onRadiusChange(e) {
    const radius = e.detail.value
    this.setData({
      searchRadius: parseInt(radius)
    })
  }
})
