const app = getApp()
import { getCurrentLocation, formatDistance } from '../../utils/location.js'
import { getActivities } from '../../utils/api.js'

Page({
  data: {
    currentLocation: null,
    activities: [],
    selectedTags: [],
    allTags: [
      { id: 'culture', name: '文化', icon: '🏛️', selected: false },
      { id: 'art', name: '艺术', icon: '🎨', selected: false },
      { id: 'entertainment', name: '人文娱乐', icon: '🎭', selected: false },
      { id: 'nature', name: '自然景观', icon: '🌳', selected: false },
      { id: 'popular', name: '旅游热门', icon: '🔥', selected: false },
      { id: 'food', name: '美食', icon: '🍽️', selected: false },
      { id: 'shopping', name: '购物', icon: '🛍️', selected: false },
      { id: 'history', name: '历史', icon: '📜', selected: false }
    ],
    isLoading: false,
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    showFilter: false,
    sortBy: 'recommend',
    activityDetail: null,
    showDetail: false
  },

  onLoad(options) {
    this.initPage(options)
  },

  onShow() {
    if (this.data.activities.length === 0) {
      this.loadActivities()
    }
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
    
    if (options.id) {
      this.loadActivityDetail(options.id)
    }
  },

  async loadActivities(loadMore = false) {
    const { currentPage, pageSize, selectedTags, sortBy, currentLocation, isLoading, hasMore } = this.data
    
    if (isLoading || (!hasMore && loadMore)) {
      return
    }
    
    this.setData({
      isLoading: true
    })
    
    if (!loadMore) {
      app.showLoading('加载中...')
    }
    
    try {
      const result = await getActivities(
        currentLocation, 
        selectedTags, 
        loadMore ? currentPage : 1, 
        pageSize
      )
      
      const activitiesWithDistance = result.list.map(activity => {
        let distanceText = null
        if (activity.location && currentLocation) {
          const distance = this.calculateDistanceToActivity(activity, currentLocation)
          distanceText = formatDistance(distance)
        }
        return {
          ...activity,
          distanceText: distanceText
        }
      })
      
      const newActivities = loadMore 
        ? [...this.data.activities, ...activitiesWithDistance]
        : activitiesWithDistance
      
      this.setData({
        activities: newActivities,
        currentPage: loadMore ? currentPage + 1 : 2,
        hasMore: result.list.length >= pageSize,
        isLoading: false
      })
      
      if (!loadMore) {
        app.hideLoading()
      }
      
    } catch (error) {
      console.error('加载活动失败:', error)
      this.setData({
        isLoading: false
      })
      
      if (!loadMore) {
        app.hideLoading()
      }
      
      app.showToast('加载失败')
    }
  },

  calculateDistanceToActivity(activity, currentLocation) {
    if (!activity.location || !currentLocation) {
      return 0
    }
    
    const R = 6371
    const dLat = (activity.location.latitude - currentLocation.latitude) * Math.PI / 180
    const dLon = (activity.location.longitude - currentLocation.longitude) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(currentLocation.latitude * Math.PI / 180) * Math.cos(activity.location.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },

  onTagTap(e) {
    const { tag } = e.currentTarget.dataset
    if (!tag) return
    
    const { selectedTags, allTags } = this.data
    const isSelected = selectedTags.includes(tag.id)
    
    let newSelectedTags
    if (isSelected) {
      newSelectedTags = selectedTags.filter(id => id !== tag.id)
    } else {
      newSelectedTags = [...selectedTags, tag.id]
    }
    
    const updatedTags = allTags.map(t => {
      if (t.id === tag.id) {
        return { ...t, selected: !isSelected }
      }
      return t
    })
    
    this.setData({
      selectedTags: newSelectedTags,
      allTags: updatedTags,
      currentPage: 1,
      activities: []
    })
    
    this.loadActivities()
  },

  onActivityTap(e) {
    const { activity } = e.currentTarget.dataset
    if (!activity) return
    
    this.setData({
      activityDetail: activity,
      showDetail: true
    })
  },

  onCloseDetail() {
    this.setData({
      showDetail: false,
      activityDetail: null
    })
  },

  onRefresh() {
    this.setData({
      currentPage: 1,
      activities: [],
      hasMore: true
    })
    
    this.loadActivities()
  },

  onLoadMore() {
    this.loadActivities(true)
  },

  onToggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },

  onSortChange(e) {
    const { sort } = e.currentTarget.dataset
    if (!sort) return
    
    this.setData({
      sortBy: sort,
      showFilter: false,
      currentPage: 1,
      activities: []
    })
    
    this.loadActivities()
  },

  onAddToRoute() {
    const { activityDetail } = this.data
    if (!activityDetail) return
    
    const location = {
      id: Date.now(),
      name: activityDetail.title,
      address: activityDetail.location?.address || '',
      latitude: activityDetail.location?.latitude || 39.9042,
      longitude: activityDetail.location?.longitude || 116.4074,
      selected: true,
      estimatedTime: 60
    }
    
    try {
      const selectedLocations = wx.getStorageSync('selectedLocations') || []
      selectedLocations.push(location)
      wx.setStorageSync('selectedLocations', selectedLocations)
      
      app.showToast('已添加到路线规划')
    } catch (error) {
      console.error('添加到路线失败:', error)
      app.showToast('添加失败')
    }
  },

  onNavigateToActivity() {
    const { activityDetail, currentLocation } = this.data
    if (!activityDetail || !activityDetail.location) return
    
    wx.openLocation({
      latitude: activityDetail.location.latitude,
      longitude: activityDetail.location.longitude,
      name: activityDetail.title,
      address: activityDetail.location.address || '',
      scale: 18
    })
  },

  onShareActivity() {
    const { activityDetail } = this.data
    if (!activityDetail) return
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage() {
    const { activityDetail } = this.data
    
    let title = '发现了一个精彩活动'
    let path = '/pages/activities/activities'
    
    if (activityDetail) {
      title = `推荐活动：${activityDetail.title}`
      path = `/pages/activities/activities?id=${activityDetail.id}`
    }
    
    return {
      title: title,
      path: path,
      imageUrl: activityDetail?.imageUrl || '/images/share-activity.png'
    }
  },

  async loadActivityDetail(id) {
    app.showLoading('加载中...')
    
    try {
      const result = await getActivities(null, [], 1, 100)
      const activity = result.list.find(a => a.id === id)
      
      if (activity) {
        let distanceText = null
        if (activity.location && this.data.currentLocation) {
          const distance = this.calculateDistanceToActivity(activity, this.data.currentLocation)
          distanceText = formatDistance(distance)
        }
        
        this.setData({
          activityDetail: { ...activity, distanceText },
          showDetail: true
        })
      }
      
      app.hideLoading()
    } catch (error) {
      console.error('加载活动详情失败:', error)
      app.hideLoading()
      app.showToast('加载失败')
    }
  }
})
