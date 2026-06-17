/** 
 * JUMP DETECTOR 
 * 
 * Detects when the player physically jumps upwards.
 * 
 */

import type { Landmark } from './mediapipePlayer'

export interface MyJumpDetail {
    vel: string // upward velocity
    confidence: string // Mediapipe body detection confidence (0 to 1)
}

const JUMP_VELOCITY_THRESHOLD = 0.7 // minimum upward speed to count 
const JUMP_COOLDOWN_MS = 400 // minimum ms between jumps

let prevY = 0
let prevTs = performance.now()
let lastJumpAt = 0

export function initJumpDetector(pose: any) {
    pose.onResults(onJumpFrame)
    console.log('[JumpDetector] Ready to see you jumping!')
}

function onJumpFrame(results: any) {
    if (!results.poseLandmarks) return // in case no body is detected

    const lHip: Landmark = results.poseLandmarks[23]
    const rHip: Landmark = results.poseLandmarks[24]
    if (!lHip || !rHip) return

    const y = (lHip.y + rHip.y) / 2
    const now = performance.now()

    const dy = prevY - y
    const dt = Math.max(1, now - prevTs)
    const vel = dy / (dt / 1000)

    const confidence: number = results .poseWorldLandmarks
        ? 1.0
        : (results.poseLandmarks[0]?.visibility ?? 0)

    if (
        vel > JUMP_VELOCITY_THRESHOLD && 
        confidence > 0.6 &&
        (now - lastJumpAt) > JUMP_COOLDOWN_MS
    ) {
        lastJumpAt = now

        window.dispatchEvent(new CustomEvent<MyJumpDetail>('mv:jump', {
            detail: {
                vel: vel.toFixed(3),
                confidence: confidence.toFixed(3)
            }
        }))
        console.log(`[JumpDetector] Jump! vel=${vel.toFixed(3)}`)
    }

    prevY = y
    prevTs = now
}