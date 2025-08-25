import { supabase } from '../../../lib/supabase-admin'
import { createCanvas, loadImage, registerFont } from 'canvas'
import path from 'path'

/**
 * API endpoint for generating course completion certificates
 * 
 * POST /api/certificates/generate
 * Body: {
 *   user_id: string,
 *   course_id: string
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user_id, course_id } = req.body

    if (!user_id || !course_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, course_id' 
      })
    }

    // Check if course is completed by user
    const { data: completion, error: completionError } = await supabase
      .from('course_completions')
      .select(`
        *,
        courses!inner(title, category),
        profiles!inner(name, email)
      `)
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .single()

    if (completionError || !completion) {
      return res.status(404).json({ 
        error: 'Course not completed or completion not found' 
      })
    }

    // Generate certificate
    const certificateBuffer = await generateCertificatePDF({
      studentName: completion.profiles.name,
      courseName: completion.courses.title,
      courseCategory: completion.courses.category,
      completionDate: new Date(completion.completed_at),
      certificateId: `CERT-${course_id}-${user_id}-${Date.now()}`
    })

    // Store certificate in database
    const certificateId = `cert_${user_id}_${course_id}_${Date.now()}`
    
    const { error: certError } = await supabase
      .from('certificates')
      .insert({
        id: certificateId,
        user_id,
        course_id,
        student_name: completion.profiles.name,
        course_name: completion.courses.title,
        issued_at: new Date().toISOString(),
        certificate_data: certificateBuffer.toString('base64')
      })

    if (certError) {
      console.error('Error storing certificate:', certError)
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${completion.courses.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`)
    res.setHeader('Content-Length', certificateBuffer.length)

    res.send(certificateBuffer)

  } catch (error) {
    console.error('Certificate generation error:', error)
    res.status(500).json({ 
      error: 'Failed to generate certificate',
      details: error.message 
    })
  }
}

/**
 * Generate a beautiful PDF certificate
 */
async function generateCertificatePDF({
  studentName,
  courseName,
  courseCategory,
  completionDate,
  certificateId
}) {
  const PDFDocument = require('pdfkit')
  const fs = require('fs')

  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width
      const pageHeight = doc.page.height

      // Background gradient
      doc.rect(0, 0, pageWidth, pageHeight)
        .linearGradient(0, 0, pageWidth, pageHeight, {
          0: '#1a1a2e',
          0.5: '#16213e',
          1: '#0f3460'
        })

      // Certificate border
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
        .lineWidth(3)
        .stroke('#d4af37')

      doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
        .lineWidth(1)
        .stroke('#d4af37')

      // Certificate title
      doc.fontSize(48)
        .font('Helvetica-Bold')
        .fillColor('#d4af37')
        .text('CERTIFICATE', 0, 80, { align: 'center' })

      doc.fontSize(24)
        .fillColor('#ffffff')
        .text('OF COMPLETION', 0, 140, { align: 'center' })

      // Decorative line
      doc.rect(pageWidth/2 - 100, 180, 200, 2)
        .fill('#d4af37')

      // Main content
      doc.fontSize(18)
        .fillColor('#ffffff')
        .text('This is to certify that', 0, 220, { align: 'center' })

      doc.fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#d4af37')
        .text(studentName, 0, 260, { align: 'center' })

      doc.fontSize(18)
        .font('Helvetica')
        .fillColor('#ffffff')
        .text('has successfully completed the course', 0, 320, { align: 'center' })

      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text(courseName, 0, 360, { align: 'center' })

      doc.fontSize(16)
        .font('Helvetica')
        .fillColor('#cccccc')
        .text(`Category: ${courseCategory}`, 0, 410, { align: 'center' })

      // Date and signature section
      doc.fontSize(14)
        .fillColor('#ffffff')
        .text(`Date of Completion: ${completionDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, 0, 480, { align: 'center' })

      // Certificate ID
      doc.fontSize(10)
        .fillColor('#888888')
        .text(`Certificate ID: ${certificateId}`, 0, 520, { align: 'center' })

      // Footer
      doc.fontSize(12)
        .fillColor('#d4af37')
        .text('MathPro Academy', 60, pageHeight - 80)

      doc.fillColor('#ffffff')
        .text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - 200, pageHeight - 80)

      // Add some decorative elements
      drawStar(doc, 100, 100, '#d4af37')
      drawStar(doc, pageWidth - 100, 100, '#d4af37')
      drawStar(doc, 100, pageHeight - 100, '#d4af37')
      drawStar(doc, pageWidth - 100, pageHeight - 100, '#d4af37')

      doc.end()

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Draw a decorative star
 */
function drawStar(doc, x, y, color) {
  doc.save()
  doc.translate(x, y)
  
  const spikes = 5
  const outerRadius = 20
  const innerRadius = 10
  
  doc.moveTo(0, -outerRadius)
  
  for (let i = 0; i < spikes; i++) {
    const angle = (i * Math.PI * 2) / spikes
    const nextAngle = ((i + 1) * Math.PI * 2) / spikes
    
    doc.lineTo(Math.sin(angle + Math.PI / spikes) * innerRadius, 
              -Math.cos(angle + Math.PI / spikes) * innerRadius)
    doc.lineTo(Math.sin(nextAngle) * outerRadius, 
              -Math.cos(nextAngle) * outerRadius)
  }
  
  doc.closePath()
  doc.fillColor(color)
  doc.fill()
  doc.restore()
}