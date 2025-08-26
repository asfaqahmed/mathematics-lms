import { formatPrice, formatDuration, formatDate } from '../../utils/formatters'

describe('Formatter Utilities', () => {
  describe('formatPrice', () => {
    it('should format prices correctly in LKR', () => {
      expect(formatPrice(1000)).toBe('LKR 1,000')
      expect(formatPrice(5000)).toBe('LKR 5,000')
      expect(formatPrice(15000)).toBe('LKR 15,000')
      expect(formatPrice(1500000)).toBe('LKR 1,500,000')
    })

    it('should handle zero price', () => {
      expect(formatPrice(0)).toBe('LKR 0')
    })

    it('should handle decimal prices', () => {
      expect(formatPrice(1000.50)).toBe('LKR 1,001') // Rounded
      expect(formatPrice(1234.99)).toBe('LKR 1,235') // Rounded
    })

    it('should handle negative prices', () => {
      expect(formatPrice(-1000)).toBe('LKR -1,000')
    })

    it('should handle very large numbers', () => {
      expect(formatPrice(1000000000)).toBe('LKR 1,000,000,000')
    })

    it('should handle edge cases', () => {
      expect(formatPrice(null)).toBe('LKR 0')
      expect(formatPrice(undefined)).toBe('LKR 0')
      expect(formatPrice('')).toBe('LKR 0')
      expect(formatPrice('1000')).toBe('LKR 1,000')
    })
  })

  describe('formatDuration', () => {
    it('should format duration in minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(3600)).toBe('60:00') // 1 hour as minutes
      expect(formatDuration(3665)).toBe('61:05') // 1 hour 1 minute 5 seconds
    })

    it('should handle seconds only', () => {
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(59)).toBe('0:59')
      expect(formatDuration(5)).toBe('0:05')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00')
    })

    it('should handle very long durations', () => {
      expect(formatDuration(7200)).toBe('120:00') // 2 hours
      expect(formatDuration(36000)).toBe('600:00') // 10 hours
    })

    it('should handle edge cases', () => {
      expect(formatDuration(null)).toBe('0:00')
      expect(formatDuration(undefined)).toBe('0:00')
      expect(formatDuration('')).toBe('0:00')
      expect(formatDuration('60')).toBe('1:00')
    })

    it('should handle decimal seconds', () => {
      expect(formatDuration(90.5)).toBe('1:31') // Rounded up
      expect(formatDuration(59.9)).toBe('1:00') // Rounded up
    })
  })

  describe('formatDate', () => {
    it('should format dates in readable format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      
      expect(formatted).toMatch(/Jan(uary)?\s+15,?\s+2024/i)
    })

    it('should handle ISO date strings', () => {
      const isoString = '2024-01-15T10:30:00Z'
      const formatted = formatDate(isoString)
      
      expect(formatted).toMatch(/Jan(uary)?\s+15,?\s+2024/i)
    })

    it('should handle different date formats', () => {
      const dates = [
        '2024-01-15',
        '2024/01/15',
        '01-15-2024',
        new Date(2024, 0, 15) // Month is 0-indexed
      ]

      dates.forEach(date => {
        const formatted = formatDate(date)
        expect(formatted).toMatch(/Jan(uary)?\s+15,?\s+2024/i)
      })
    })

    it('should handle edge cases', () => {
      expect(formatDate(null)).toBe('Invalid Date')
      expect(formatDate(undefined)).toBe('Invalid Date')
      expect(formatDate('')).toBe('Invalid Date')
      expect(formatDate('invalid-date')).toBe('Invalid Date')
    })

    it('should format different months correctly', () => {
      const months = [
        { date: '2024-01-01', expected: /Jan/i },
        { date: '2024-02-01', expected: /Feb/i },
        { date: '2024-03-01', expected: /Mar/i },
        { date: '2024-12-01', expected: /Dec/i }
      ]

      months.forEach(({ date, expected }) => {
        const formatted = formatDate(date)
        expect(formatted).toMatch(expected)
      })
    })

    it('should handle leap years', () => {
      const leapYearDate = '2024-02-29'
      const formatted = formatDate(leapYearDate)
      
      expect(formatted).toMatch(/Feb(ruary)?\s+29,?\s+2024/i)
    })

    it('should handle different years', () => {
      const years = [2020, 2021, 2022, 2023, 2024, 2025]

      years.forEach(year => {
        const date = `${year}-06-15`
        const formatted = formatDate(date)
        expect(formatted).toContain(year.toString())
      })
    })

    it('should be timezone aware', () => {
      const utcDate = '2024-01-15T23:30:00Z'
      const formatted = formatDate(utcDate)
      
      // Should handle timezone conversion appropriately
      expect(formatted).toMatch(/2024/)
      expect(typeof formatted).toBe('string')
    })
  })

  describe('Integration tests for formatters', () => {
    it('should work together in course display scenario', () => {
      const courseData = {
        price: 5000,
        duration: 3600, // 1 hour
        created_at: '2024-01-15T10:30:00Z'
      }

      expect(formatPrice(courseData.price)).toBe('LKR 5,000')
      expect(formatDuration(courseData.duration)).toBe('60:00')
      expect(formatDate(courseData.created_at)).toMatch(/Jan(uary)?\s+15,?\s+2024/i)
    })

    it('should handle all null/undefined values gracefully', () => {
      const invalidData = {
        price: null,
        duration: undefined,
        created_at: ''
      }

      expect(() => formatPrice(invalidData.price)).not.toThrow()
      expect(() => formatDuration(invalidData.duration)).not.toThrow()
      expect(() => formatDate(invalidData.created_at)).not.toThrow()

      expect(formatPrice(invalidData.price)).toBe('LKR 0')
      expect(formatDuration(invalidData.duration)).toBe('0:00')
      expect(formatDate(invalidData.created_at)).toBe('Invalid Date')
    })
  })

  describe('Performance tests', () => {
    it('should format large numbers of prices efficiently', () => {
      const prices = Array.from({ length: 1000 }, (_, i) => i * 1000)
      
      const startTime = Date.now()
      prices.forEach(price => formatPrice(price))
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should format large numbers of durations efficiently', () => {
      const durations = Array.from({ length: 1000 }, (_, i) => i * 60)
      
      const startTime = Date.now()
      durations.forEach(duration => formatDuration(duration))
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should format large numbers of dates efficiently', () => {
      const dates = Array.from({ length: 100 }, (_, i) => 
        new Date(2024, 0, i + 1).toISOString()
      )
      
      const startTime = Date.now()
      dates.forEach(date => formatDate(date))
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('Localization tests', () => {
    it('should be consistent with number formatting', () => {
      const testPrices = [1000, 10000, 100000, 1000000]
      
      testPrices.forEach(price => {
        const formatted = formatPrice(price)
        expect(formatted).toMatch(/^LKR\s[\d,]+$/)
      })
    })

    it('should handle different locale number formats', () => {
      const originalLocale = Intl.NumberFormat().resolvedOptions().locale
      
      // Test should work regardless of system locale
      const formatted = formatPrice(1234567)
      expect(formatted).toMatch(/LKR\s1,234,567/)
    })
  })
})