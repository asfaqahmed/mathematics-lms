// Currency formatter
export const formatCurrency = (amount, currency = 'LKR') => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (currency === 'LKR') {
    return `LKR ${(value / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value / 100)
}

// Date formatter
export const formatDate = (date, format = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  if (format === 'time') {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  
  if (format === 'datetime') {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  
  return dateObj.toISOString()
}

// Duration formatter (minutes to human readable)
export const formatDuration = (minutes) => {
  if (!minutes) return '0m'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}m`
  }
  
  if (mins === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${mins}m`
}

// Number formatter
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Percentage formatter
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`
}

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Phone formatter
export const formatPhone = (phone) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Sri Lankan format
  if (cleaned.startsWith('94')) {
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{3})(\d{4})$/)
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
  }
  
  // Default format
  return phone
}

// Name formatter
export const formatName = (firstName, lastName) => {
  if (lastName) {
    return `${firstName} ${lastName}`
  }
  return firstName
}

// Initials formatter
export const getInitials = (name) => {
  if (!name) return ''
  
  const parts = name.split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
}

// Slug formatter
export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

// Truncate text
export const truncate = (text, length = 100) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Time ago formatter
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  
  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) return interval + ' years ago'
  if (interval === 1) return '1 year ago'
  
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) return interval + ' months ago'
  if (interval === 1) return '1 month ago'
  
  interval = Math.floor(seconds / 86400)
  if (interval > 1) return interval + ' days ago'
  if (interval === 1) return '1 day ago'
  
  interval = Math.floor(seconds / 3600)
  if (interval > 1) return interval + ' hours ago'
  if (interval === 1) return '1 hour ago'
  
  interval = Math.floor(seconds / 60)
  if (interval > 1) return interval + ' minutes ago'
  if (interval === 1) return '1 minute ago'
  
  return 'just now'
}

// YouTube ID extractor
export const getYouTubeId = (url) => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// YouTube embed URL generator
export const getYouTubeEmbedUrl = (url) => {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : url
}

// Status color mapper
export const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    failed: 'danger',
    active: 'success',
    inactive: 'gray',
    published: 'success',
    draft: 'warning'
  }
  return colors[status] || 'primary'
}].charAt(0).toUpperCase()
  }
  
  return parts[0