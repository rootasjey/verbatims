/**
 * Onboarding Progress SSE Endpoint
 * Provides real-time progress updates via Server-Sent Events
 */

import { getProgress, registerProgressHandler, unregisterProgressHandler } from '~/server/utils/onboarding-progress'

export default defineEventHandler(async (event) => {
  const importId = getRouterParam(event, 'id')
  
  if (!importId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Import ID is required'
    })
  }

  // Check if progress exists
  const progress = getProgress(importId)
  if (!progress) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Import progress not found'
    })
  }

  // Check if client accepts SSE
  const accept = getHeader(event, 'accept')
  if (accept && accept.includes('text/event-stream')) {
    return handleSSE(event, importId, progress)
  }

  // Fallback: return current progress as JSON
  return {
    success: true,
    data: progress
  }
})

/**
 * Handle Server-Sent Events connection
 */
async function handleSSE(event: any, importId: string, initialProgress: any) {
  // Set SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Headers', 'Cache-Control')

  // Create a readable stream for SSE
  const encoder = new TextEncoder()
  let isConnected = true
  let heartbeatInterval: NodeJS.Timeout | null = null
  let connectionTimeout: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      try {
        // Send initial progress
        const initialData = formatSSEMessage('progress', initialProgress)
        controller.enqueue(encoder.encode(initialData))

        // Send heartbeat every 30 seconds
        heartbeatInterval = setInterval(() => {
          if (!isConnected) {
            clearInterval(heartbeatInterval!)
            return
          }

          try {
            const heartbeat = formatSSEMessage('heartbeat', { timestamp: new Date().toISOString() })
            controller.enqueue(encoder.encode(heartbeat))
          } catch (error) {
            console.error('Heartbeat failed:', error)
            cleanup()
          }
        }, 30000)

        // Set connection timeout (10 minutes)
        connectionTimeout = setTimeout(() => {
          console.log(`SSE connection timeout for import ${importId}`)
          const timeoutData = formatSSEMessage('error', {
            message: 'Connection timeout',
            code: 'TIMEOUT'
          })
          try {
            controller.enqueue(encoder.encode(timeoutData))
          } catch (error) {
            console.error('Failed to send timeout message:', error)
          }
          cleanup()
        }, 10 * 60 * 1000)

        // Cleanup function
        const cleanup = () => {
          isConnected = false
          if (heartbeatInterval) clearInterval(heartbeatInterval)
          if (connectionTimeout) clearTimeout(connectionTimeout)
          try {
            controller.close()
          } catch (error) {
            // Controller might already be closed
          }
        }

        // Register for progress updates
        const progressHandler = (updatedProgress: any) => {
          if (!isConnected) return

          try {
            const data = formatSSEMessage('progress', updatedProgress)
            controller.enqueue(encoder.encode(data))

            // Close connection if import is completed or failed
            if (updatedProgress.status === 'completed' || updatedProgress.status === 'failed') {
              setTimeout(() => {
                try {
                  const closeData = formatSSEMessage('close', { reason: updatedProgress.status })
                  controller.enqueue(encoder.encode(closeData))
                } catch (error) {
                  console.error('Failed to send close message:', error)
                }
                cleanup()
              }, 1000) // Give client time to process final update
            }
          } catch (error) {
            console.error('Failed to send progress update:', error)
            cleanup()
          }
        }

  // Store the progress handler for this connection (via utils)
  registerProgressHandler(importId, progressHandler)

        // Handle client disconnect
        event.node.req.on('close', () => {
          console.log(`Client disconnected from import ${importId}`)
          unregisterProgressHandler(importId, progressHandler)
          cleanup()
        })

        event.node.req.on('error', (error: any) => {
          console.error(`SSE connection error for import ${importId}:`, error)
          unregisterProgressHandler(importId, progressHandler)
          cleanup()
        })

      } catch (error) {
        console.error('Failed to initialize SSE connection:', error)
        isConnected = false
        if (heartbeatInterval) clearInterval(heartbeatInterval)
        if (connectionTimeout) clearTimeout(connectionTimeout)
        controller.close()
      }
    },

    cancel() {
      console.log(`SSE connection cancelled for import ${importId}`)
      isConnected = false
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      if (connectionTimeout) clearTimeout(connectionTimeout)
      unregisterProgressHandler(importId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

/**
 * Format message for SSE
 */
function formatSSEMessage(type: string, data: any): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
}

// Handlers now managed centrally in utils/onboarding-progress.ts
