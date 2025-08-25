import { useState } from 'react'
import UniversalVideoPlayer from '../components/course/UniversalVideoPlayer'
import Header from '../components/layout/Header'
import { getVideoType } from '../utils/video'

/**
 * Test page for video player functionality
 * This page can be accessed at /test-video to debug video issues
 */
export default function TestVideo({ user }) {
  const [testUrls] = useState([
    'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    'https://youtu.be/WUvTyaaNkzM',
    'https://www.youtube.com/embed/WUvTyaaNkzM',
    'https://plhiqkvxikrugafmnmqd.supabase.co/storage/v1/object/public/course-videos/sample-video.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'invalid-url'
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header user={user} />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-8">Video Player Test</h1>
          
          <div className="space-y-8">
            {testUrls.map((url, index) => {
              const videoType = getVideoType(url)
              return (
                <div key={index} className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      Test {index + 1}: {videoType}
                    </h2>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      videoType === 'youtube' ? 'bg-red-500/20 text-red-400' :
                      videoType === 'supabase' ? 'bg-green-500/20 text-green-400' :
                      videoType === 'direct' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {videoType}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 break-all">{url}</p>
                  
                  <div className="max-w-2xl">
                    <UniversalVideoPlayer
                      videoUrl={url}
                      title={`Test Video ${index + 1}`}
                      hasAccess={true}
                      onProgress={(progress, currentTime, duration) => {
                        console.log(`Test ${index + 1} progress: ${Math.round(progress)}%`)
                      }}
                      onComplete={() => {
                        console.log(`Test ${index + 1} completed!`)
                      }}
                      onError={(error) => {
                        console.error(`Test ${index + 1} error:`, error)
                      }}
                      onLoadEnd={() => {
                        console.log(`Test ${index + 1} loaded successfully`)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-12 glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Video Player Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h3 className="font-medium text-white mb-2">Supported Video Types:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-red-400">YouTube:</span> All YouTube URL formats</li>
                  <li><span className="text-green-400">Supabase:</span> Videos stored in Supabase storage</li>
                  <li><span className="text-blue-400">Direct:</span> Direct video file URLs (.mp4, .webm, etc.)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Progress tracking for course completion</li>
                  <li>Full video controls for direct videos</li>
                  <li>Access control integration</li>
                  <li>Format validation and error handling</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Common Issues:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Video file format not supported by browser</li>
                  <li>Network connectivity issues</li>
                  <li>CORS restrictions on external videos</li>
                  <li>Video file corrupted or inaccessible</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Troubleshooting:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Check browser console for error messages</li>
                  <li>Try opening video URL directly in new tab</li>
                  <li>Verify video file is not corrupted</li>
                  <li>Use "Try Again" or "Open Video Directly" buttons</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}