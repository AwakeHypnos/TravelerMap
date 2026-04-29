const app = getApp()
import { getCurrentLocation, chooseLocation, calculateDistance, formatDistance, formatDuration } from '../../utils/location.js'
import { generateShortestPath, generateOptimalTour, calculateTotalDistance, estimateTime, planRouteWithTimeConstraints, validateLocations } from '../../utils/routePlanner.js'

Page({
  data: {
    locations: [],
    currentLocation: null,
    selectedLocations: [],
    activeLocationCount: 0,
    canPlanRoute: false,
    plannedRoute: null,
    routeMode: 'shortest',
    showTimePlan: false,
    timePlan: {
      startTime: null,
      timePerLocation: 60,
      maxTotalTime: 480
    },
    showAddPanel: false,
    showResultPanel: false,
    locationMode: 'manual',
    searchKeyword: '',
    searchResults: [],
    showSearch: false
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadSavedLocations()
  },

  async initPage() {
    try {
      const location = await getCurrentLocation()
      this.setData({
        currentLocation: location
      })
    } catch (error) {
      console.error('获取位置失败:', error)
    }
  },

  updateActiveLocationCount() {
    const { selectedLocations } = this.data
    const activeCount = selectedLocations.filter(loc => loc.selected).length
    const canPlan = activeCount >= 2
    
    this.setData({
      activeLocationCount: activeCount,
      canPlanRoute: canPlan
    })
  },

  loadSavedLocations() {
    try {
      const savedLocations = wx.getStorageSync('selectedLocations') || []
      this.setData({
        selectedLocations: savedLocations
      }, () => {
        this.updateActiveLocationCount()
      })
    } catch (error) {
      console.error('加载保存的地点失败:', error)
    }
  },

  onAddLocation() {
    this.setData({
      showAddPanel: true
    })
  },

  onCloseAddPanel() {
    this.setData({
      showAddPanel: false,
      searchKeyword: '',
      searchResults: [],
      showSearch: false
    })
  },

  onLocationModeChange(e) {
    const { mode } = e.currentTarget.dataset
    this.setData({
      locationMode: mode
    })
  },

  onChooseLocation() {
    chooseLocation()
      .then(location => {
        this.addLocationToList(location)
        this.onCloseAddPanel()
      })
      .catch(err => {
        console.error('选择位置失败:', err)
      })
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  onSearchConfirm() {
    const { searchKeyword, currentLocation } = this.data
    if (!searchKeyword) return
    
    app.showLoading('搜索中...')
    
    import('../../utils/api.js').then(api => {
      api.searchPlaces(searchKeyword, currentLocation, 5000)
        .then(results => {
          this.setData({
            searchResults: results,
            showSearch: true
          })
          app.hideLoading()
        })
        .catch(err => {
          console.error('搜索失败:', err)
          app.hideLoading()
          app.showToast('搜索失败')
        })
    })
  },

  onSelectSearchResult(e) {
    const location = e.currentTarget.dataset.location
    if (location) {
      this.addLocationToList(location)
      this.onCloseAddPanel()
    }
  },

  addLocationToList(location) {
    const { selectedLocations, currentLocation } = this.data
    
    const exists = selectedLocations.some(loc => 
      Math.abs(loc.latitude - location.latitude) < 0.0001 && 
      Math.abs(loc.longitude - location.longitude) < 0.0001
    )
    
    if (exists) {
      app.showToast('该地点已添加')
      return
    }
    
    let distance = null
    if (currentLocation) {
      distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        location.latitude,
        location.longitude
      )
    }
    
    const newLocation = {
      ...location,
      id: Date.now(),
      distance: distance,
      distanceText: distance ? formatDistance(distance) : null,
      estimatedTime: 60,
      selected: true
    }
    
    const updatedLocations = [...selectedLocations, newLocation]
    
    this.setData({
      selectedLocations: updatedLocations
    }, () => {
      this.updateActiveLocationCount()
    })
    
    try {
      wx.setStorageSync('selectedLocations', updatedLocations)
    } catch (error) {
      console.error('保存地点失败:', error)
    }
    
    app.showToast('已添加')
  },

  onRemoveLocation(e) {
    const { id } = e.currentTarget.dataset
    const { selectedLocations } = this.data
    
    wx.showModal({
      title: '确认移除',
      content: '确定要移除此地点吗？',
      success: (res) => {
        if (res.confirm) {
          const updatedLocations = selectedLocations.filter(loc => loc.id !== id)
          
          this.setData({
            selectedLocations: updatedLocations
          }, () => {
            this.updateActiveLocationCount()
          })
          
          try {
            wx.setStorageSync('selectedLocations', updatedLocations)
          } catch (error) {
            console.error('保存地点失败:', error)
          }
          
          app.showToast('已移除')
        }
      }
    })
  },

  onToggleLocationSelect(e) {
    const { id } = e.currentTarget.dataset
    const { selectedLocations } = this.data
    
    const updatedLocations = selectedLocations.map(loc => {
      if (loc.id === id) {
        return { ...loc, selected: !loc.selected }
      }
      return loc
    })
    
    this.setData({
      selectedLocations: updatedLocations
    }, () => {
      this.updateActiveLocationCount()
    })
  },

  onTimePerLocationChange(e) {
    const { timePlan } = this.data
    this.setData({
      timePlan: {
        ...timePlan,
        timePerLocation: parseInt(e.detail.value) || 60
      }
    })
  },

  onMaxTimeChange(e) {
    const { timePlan } = this.data
    this.setData({
      timePlan: {
        ...timePlan,
        maxTotalTime: parseInt(e.detail.value) || 480
      }
    })
  },

  onTimeStartChange(e) {
    const { timePlan } = this.data
    this.setData({
      timePlan: {
        ...timePlan,
        startTime: e.detail.value
      }
    })
  },

  onToggleTimePlan() {
    this.setData({
      showTimePlan: !this.data.showTimePlan
    })
  },

  onRouteModeChange(e) {
    const { mode } = e.currentTarget.dataset
    this.setData({
      routeMode: mode
    })
  },

  onPlanRoute() {
    const { selectedLocations, routeMode, timePlan, showTimePlan, currentLocation } = this.data
    
    const activeLocations = selectedLocations.filter(loc => loc.selected)
    
    const validation = validateLocations(activeLocations)
    if (!validation.valid) {
      app.showToast(validation.message)
      return
    }
    
    if (activeLocations.length < 2) {
      app.showToast('请至少选择2个地点')
      return
    }
    
    app.showLoading('规划路线中...')
    
    setTimeout(() => {
      let plannedPath
      
      if (showTimePlan && timePlan.startTime) {
        plannedPath = planRouteWithTimeConstraints(activeLocations, timePlan)
      } else if (routeMode === 'optimal') {
        plannedPath = generateOptimalTour(activeLocations, 0)
      } else {
        plannedPath = generateShortestPath(activeLocations, 0)
      }
      
      const totalDistance = calculateTotalDistance(plannedPath)
      const totalTime = estimateTime(totalDistance) + (plannedPath.length - 1) * 60
      
      const routeInfo = {
        path: plannedPath,
        totalDistance: totalDistance,
        totalDistanceText: formatDistance(totalDistance),
        totalTime: totalTime,
        totalTimeText: formatDuration(totalTime),
        locationCount: plannedPath.length,
        mode: routeMode,
        createdAt: new Date().toISOString()
      }
      
      this.setData({
        plannedRoute: routeInfo,
        showResultPanel: true
      })
      
      this.saveRoute(routeInfo)
      
      app.hideLoading()
    }, 1000)
  },

  saveRoute(routeInfo) {
    try {
      const savedRoutes = wx.getStorageSync('savedRoutes') || []
      
      const routeToSave = {
        ...routeInfo,
        id: Date.now(),
        name: `路线 ${new Date().toLocaleDateString('zh-CN')}`
      }
      
      savedRoutes.unshift(routeToSave)
      
      wx.setStorageSync('savedRoutes', savedRoutes.slice(0, 20))
    } catch (error) {
      console.error('保存路线失败:', error)
    }
  },

  onCloseResultPanel() {
    this.setData({
      showResultPanel: false
    })
  },

  onViewOnMap() {
    const { plannedRoute, currentLocation } = this.data
    if (!plannedRoute) return
    
    const markers = plannedRoute.path.map((loc, index) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      name: loc.name || `地点${index + 1}`,
      address: loc.address
    }))
    
    const markersParam = encodeURIComponent(JSON.stringify(markers))
    
    wx.navigateTo({
      url: `/pages/map/map?markers=${markersParam}&showRoute=true`
    })
  },

  onShareRoute() {
    const { plannedRoute } = this.data
    if (!plannedRoute) return
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onClearAll() {
    const { selectedLocations } = this.data
    if (selectedLocations.length === 0) {
      app.showToast('没有可清除的地点')
      return
    }
    
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有选择的地点吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            selectedLocations: []
          }, () => {
            this.updateActiveLocationCount()
          })
          
          try {
            wx.removeStorageSync('selectedLocations')
          } catch (error) {
            console.error('清除地点失败:', error)
          }
          
          app.showToast('已清除')
        }
      }
    })
  },

  onEditEstimatedTime(e) {
    const { id } = e.currentTarget.dataset
    const { selectedLocations } = this.data
    
    const location = selectedLocations.find(loc => loc.id === id)
    if (!location) return
    
    wx.showActionSheet({
      itemList: ['30分钟', '60分钟', '90分钟', '120分钟', '自定义'],
      success: (res) => {
        const timeOptions = [30, 60, 90, 120]
        let newTime
        
        if (res.tapIndex < 4) {
          newTime = timeOptions[res.tapIndex]
        } else {
          wx.showModal({
            title: '设置预计时间',
            editable: true,
            placeholderText: '请输入分钟数',
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                const parsed = parseInt(modalRes.content)
                if (!isNaN(parsed) && parsed > 0) {
                  this.updateLocationTime(id, parsed)
                } else {
                  app.showToast('请输入有效时间')
                }
              }
            }
          })
          return
        }
        
        this.updateLocationTime(id, newTime)
      }
    })
  },

  updateLocationTime(id, time) {
    const { selectedLocations } = this.data
    
    const updatedLocations = selectedLocations.map(loc => {
      if (loc.id === id) {
        return { ...loc, estimatedTime: time }
      }
      return loc
    })
    
    this.setData({
      selectedLocations: updatedLocations
    })
    
    try {
      wx.setStorageSync('selectedLocations', updatedLocations)
    } catch (error) {
      console.error('保存地点失败:', error)
    }
    
    app.showToast('已更新')
  },

  onShareAppMessage() {
    const { plannedRoute, selectedLocations } = this.data
    
    let title = '旅游地图路线规划'
    let path = '/pages/index/index'
    
    if (plannedRoute) {
      title = `我规划了一条${plannedRoute.locationCount}个地点的路线，总距离${plannedRoute.totalDistanceText}`
      path = `/pages/route/route?shared=true`
    }
    
    return {
      title: title,
      path: path,
      imageUrl: '/images/share-route.png'
    }
  }
})
