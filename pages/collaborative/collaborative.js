const app = getApp()
import { getCurrentLocation, chooseLocation, formatDistance } from '../../utils/location.js'
import { createCollaborativeRoom, joinCollaborativeRoom } from '../../utils/api.js'

Page({
  data: {
    currentLocation: null,
    roomId: null,
    roomInfo: null,
    isHost: false,
    members: [],
    mapMarkers: [],
    routeOptions: [],
    votes: {},
    votingActive: false,
    selectedOption: null,
    showCreatePanel: false,
    showJoinPanel: false,
    showAddMarkerPanel: false,
    showVotePanel: false,
    showResultPanel: false,
    newRoomName: '',
    joinRoomId: '',
    markerName: '',
    markerDescription: '',
    userInfo: null,
    voteResults: null,
    randomResult: null,
    showRandomPanel: false
  },

  onLoad() {
    this.initPage()
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
    
    this.loadUserInfo()
    this.loadSavedRoom()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  loadSavedRoom() {
    const savedRoom = wx.getStorageSync('collaborativeRoom')
    if (savedRoom && savedRoom.roomId) {
      this.setData({
        roomId: savedRoom.roomId,
        roomInfo: savedRoom.roomInfo,
        isHost: savedRoom.isHost,
        members: savedRoom.members || [],
        mapMarkers: savedRoom.mapMarkers || [],
        routeOptions: savedRoom.routeOptions || []
      })
    }
  },

  saveRoom() {
    const { roomId, roomInfo, isHost, members, mapMarkers, routeOptions } = this.data
    wx.setStorageSync('collaborativeRoom', {
      roomId,
      roomInfo,
      isHost,
      members,
      mapMarkers,
      routeOptions
    })
  },

  onShowCreatePanel() {
    this.setData({
      showCreatePanel: true,
      newRoomName: ''
    })
  },

  onCloseCreatePanel() {
    this.setData({
      showCreatePanel: false
    })
  },

  onRoomNameInput(e) {
    this.setData({
      newRoomName: e.detail.value
    })
  },

  async onCreateRoom() {
    const { newRoomName, currentLocation, userInfo } = this.data
    
    if (!newRoomName.trim()) {
      app.showToast('请输入房间名称')
      return
    }
    
    app.showLoading('创建房间中...')
    
    try {
      const room = await createCollaborativeRoom(newRoomName.trim())
      
      const member = {
        id: userInfo?.openId || 'user_' + Date.now(),
        name: userInfo?.nickName || '我',
        avatar: userInfo?.avatarUrl || null,
        isHost: true,
        joinTime: new Date().toISOString()
      }
      
      this.setData({
        roomId: room.id,
        roomInfo: room,
        isHost: true,
        members: [member],
        showCreatePanel: false,
        mapMarkers: [],
        routeOptions: []
      })
      
      this.saveRoom()
      app.hideLoading()
      app.showToast('房间创建成功')
      
    } catch (error) {
      console.error('创建房间失败:', error)
      app.hideLoading()
      app.showToast('创建失败')
    }
  },

  onShowJoinPanel() {
    this.setData({
      showJoinPanel: true,
      joinRoomId: ''
    })
  },

  onCloseJoinPanel() {
    this.setData({
      showJoinPanel: false
    })
  },

  onJoinRoomIdInput(e) {
    this.setData({
      joinRoomId: e.detail.value.toUpperCase()
    })
  },

  async onJoinRoom() {
    const { joinRoomId, userInfo } = this.data
    
    if (!joinRoomId.trim()) {
      app.showToast('请输入房间号')
      return
    }
    
    app.showLoading('加入房间中...')
    
    try {
      const result = await joinCollaborativeRoom(joinRoomId.trim(), userInfo)
      
      if (result.success) {
        const member = {
          id: userInfo?.openId || 'user_' + Date.now(),
          name: userInfo?.nickName || '我',
          avatar: userInfo?.avatarUrl || null,
          isHost: false,
          joinTime: new Date().toISOString()
        }
        
        this.setData({
          roomId: joinRoomId.trim(),
          roomInfo: {
            id: joinRoomId.trim(),
            name: '共创房间',
            maxMembers: 4
          },
          isHost: false,
          members: [member],
          showJoinPanel: false,
          mapMarkers: [],
          routeOptions: []
        })
        
        this.saveRoom()
        app.hideLoading()
        app.showToast('加入成功')
      }
      
    } catch (error) {
      console.error('加入房间失败:', error)
      app.hideLoading()
      app.showToast('房间不存在或已满')
    }
  },

  onLeaveRoom() {
    wx.showModal({
      title: '确认离开',
      content: '确定要离开当前共创房间吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('collaborativeRoom')
          this.setData({
            roomId: null,
            roomInfo: null,
            isHost: false,
            members: [],
            mapMarkers: [],
            routeOptions: [],
            votes: {},
            votingActive: false
          })
          app.showToast('已离开房间')
        }
      }
    })
  },

  onAddMarker() {
    this.setData({
      showAddMarkerPanel: true,
      markerName: '',
      markerDescription: ''
    })
  },

  onCloseAddMarkerPanel() {
    this.setData({
      showAddMarkerPanel: false
    })
  },

  onMarkerNameInput(e) {
    this.setData({
      markerName: e.detail.value
    })
  },

  onMarkerDescInput(e) {
    this.setData({
      markerDescription: e.detail.value
    })
  },

  onSelectLocation() {
    chooseLocation()
      .then(location => {
        this.setData({
          tempMarkerLocation: location
        })
        app.showToast('位置已选择')
      })
      .catch(err => {
        console.error('选择位置失败:', err)
      })
  },

  onConfirmAddMarker() {
    const { markerName, markerDescription, tempMarkerLocation, currentLocation, mapMarkers, userInfo } = this.data
    
    if (!markerName.trim()) {
      app.showToast('请输入地点名称')
      return
    }
    
    const location = tempMarkerLocation || currentLocation
    if (!location) {
      app.showToast('请选择位置')
      return
    }
    
    const newMarker = {
      id: Date.now(),
      name: markerName.trim(),
      description: markerDescription,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      createdBy: {
        id: userInfo?.openId || 'me',
        name: userInfo?.nickName || '我'
      },
      createdAt: new Date().toISOString(),
      votes: 0
    }
    
    const updatedMarkers = [...mapMarkers, newMarker]
    
    this.setData({
      mapMarkers: updatedMarkers,
      showAddMarkerPanel: false,
      tempMarkerLocation: null
    })
    
    this.saveRoom()
    app.showToast('地点已添加')
  },

  onEditMarker(e) {
    const { marker } = e.currentTarget.dataset
    if (!marker) return
    
    wx.showActionSheet({
      itemList: ['编辑名称', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editMarkerName(marker)
        } else if (res.tapIndex === 1) {
          this.deleteMarker(marker.id)
        }
      }
    })
  },

  editMarkerName(marker) {
    wx.showModal({
      title: '编辑地点名称',
      editable: true,
      content: marker.name,
      success: (res) => {
        if (res.confirm && res.content) {
          const { mapMarkers } = this.data
          const updatedMarkers = mapMarkers.map(m => {
            if (m.id === marker.id) {
              return { ...m, name: res.content }
            }
            return m
          })
          
          this.setData({
            mapMarkers: updatedMarkers
          })
          
          this.saveRoom()
          app.showToast('已更新')
        }
      }
    })
  },

  deleteMarker(markerId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地点吗？',
      success: (res) => {
        if (res.confirm) {
          const { mapMarkers } = this.data
          const updatedMarkers = mapMarkers.filter(m => m.id !== markerId)
          
          this.setData({
            mapMarkers: updatedMarkers
          })
          
          this.saveRoom()
          app.showToast('已删除')
        }
      }
    })
  },

  onViewOnMap() {
    const { mapMarkers, currentLocation } = this.data
    
    if (mapMarkers.length === 0) {
      app.showToast('还没有添加地点')
      return
    }
    
    const markers = mapMarkers.map(marker => ({
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      address: marker.address || ''
    }))
    
    const markersParam = encodeURIComponent(JSON.stringify(markers))
    
    wx.navigateTo({
      url: `/pages/map/map?markers=${markersParam}`
    })
  },

  onStartVote() {
    const { mapMarkers } = this.data
    
    if (mapMarkers.length < 2) {
      app.showToast('至少需要2个地点')
      return
    }
    
    this.setData({
      showVotePanel: true,
      votingActive: true,
      votes: {}
    })
  },

  onCloseVotePanel() {
    this.setData({
      showVotePanel: false
    })
  },

  onVote(e) {
    const { markerId } = e.currentTarget.dataset
    const { votes } = this.data
    
    const newVotes = { ...votes }
    newVotes[markerId] = (newVotes[markerId] || 0) + 1
    
    this.setData({
      votes: newVotes
    })
  },

  onConfirmVote() {
    const { votes, mapMarkers } = this.data
    
    if (Object.keys(votes).length === 0) {
      app.showToast('请至少投一票')
      return
    }
    
    const voteResults = mapMarkers.map(marker => ({
      ...marker,
      votes: votes[marker.id] || 0
    })).sort((a, b) => b.votes - a.votes)
    
    const selectedOption = voteResults[0]
    
    this.setData({
      voteResults: voteResults,
      selectedOption: selectedOption,
      showVotePanel: false,
      showResultPanel: true,
      votingActive: false
    })
  },

  onCloseResultPanel() {
    this.setData({
      showResultPanel: false
    })
  },

  onRandomSelect() {
    const { mapMarkers } = this.data
    
    if (mapMarkers.length === 0) {
      app.showToast('还没有添加地点')
      return
    }
    
    app.showLoading('随机选择中...')
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * mapMarkers.length)
      const randomResult = mapMarkers[randomIndex]
      
      this.setData({
        randomResult: randomResult,
        showRandomPanel: true
      })
      
      app.hideLoading()
    }, 1000)
  },

  onCloseRandomPanel() {
    this.setData({
      showRandomPanel: false,
      randomResult: null
    })
  },

  onUseSelected() {
    const { selectedOption, randomResult } = this.data
    const location = selectedOption || randomResult
    
    if (!location) return
    
    const locationToAdd = {
      id: Date.now(),
      name: location.name,
      address: location.address || '',
      latitude: location.latitude,
      longitude: location.longitude,
      selected: true,
      estimatedTime: 60
    }
    
    try {
      const selectedLocations = wx.getStorageSync('selectedLocations') || []
      selectedLocations.push(locationToAdd)
      wx.setStorageSync('selectedLocations', selectedLocations)
      
      app.showToast('已添加到路线规划')
      
      this.setData({
        showResultPanel: false,
        showRandomPanel: false
      })
      
    } catch (error) {
      console.error('添加失败:', error)
      app.showToast('添加失败')
    }
  },

  onShareRoom() {
    const { roomId, roomInfo } = this.data
    
    if (!roomId) {
      app.showToast('还没有加入房间')
      return
    }
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    })
  },

  onShareAppMessage() {
    const { roomId, roomInfo, isHost } = this.data
    
    return {
      title: isHost 
        ? `邀请你加入"${roomInfo?.name || '共创房间'}"`
        : '邀请你一起规划旅游路线',
      path: `/pages/collaborative/collaborative?roomId=${roomId}`,
      imageUrl: '/images/share-collaborate.png'
    }
  }
})
