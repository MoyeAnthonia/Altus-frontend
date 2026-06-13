/**
 * SQUAT DETECTOR
 */

type Landmark = {
    x: number
    y: number
    z: number
    visibility?: number
}

// Data sent with the "mv:calibrated" event
export interface MvCalibratedDetail {
  baselineY: number  // the standing hip Y value — our reference point
}

// Data sent with the "mv:squat:start" event
export interface MvSquatDetail {
  squatDepth: string  // how far below the baseline the hips dropped
}

// How far hips must drop below standing baseline to count as a squat
// 0.08 = 8% of frame height = a comfortable knee bend
const SQUAT_THRESHOLD = 0.08

// Consecutive frames hips must stay low before confirming a squat
const SQUAT_CONFIRM_FRAMES = 3

// Minimum ms between squat triggers
const SQUAT_COOLDOWN_MS = 600

// Frames to collect for the standing baseline (~1 second at 30fps)
// Player must stand still during this time
const CALIBRATION_FRAMES = 30

let baselineY: number        = 0     // standing hip Y, set after calibration
let calibrationSamples: number[] = [] // hip Y readings collected during calibration
let isCalibrated             = false  // flips to true once baseline is measured

let isSquatting     = false  // is the player currently in a squat?
let squatFrameCount = 0      // consecutive frames hips have been low
let lastSquatAt     = 0      // timestamp of last confirmed squat


/**
 * initSquatDetector(pose)
 *
 * Attaches the squat detector to a MediaPipe pose instance.
 * Call this after initMediaPipe() resolves and passes back the pose object.
 *
 * @param pose  The MediaPipe Pose instance from initMediaPipe()
 */
export function initSquatDetector(pose: any) {
  // MediaPipe will call onSquatFrame() every time it processes a video frame
  pose.onResults(onSquatFrame)

  console.log('[SquatDetector] Please stand still to calibrate...')
}

/**
 * onSquatFrame(results)
 *
 * Called by MediaPipe every frame.
 * Runs calibration first, then squat detection after calibration is done.
 *
 * COORDINATE SYSTEM:
 *   Y = 0 → TOP of frame,  Y = 1 → BOTTOM of frame
 *
 *   Standing:  hips at Y = 0.45
 *   Squatting: hips at Y = 0.55
 */
function onSquatFrame(results: any) {

  if (!results.poseLandmarks) return  // no body detected this frame

  // Landmark 23 = left hip, Landmark 24 = right hip
  // This is to get the average hip position
  const lHip: Landmark = results.poseLandmarks[23]
  const rHip: Landmark = results.poseLandmarks[24]
  if (!lHip || !rHip) return

  const y   = (lHip.y + rHip.y) / 2
  const now = performance.now()

  // Step one: CALIBRATION
  // Collect standing frames to build the hip baseline.
  // Once we have CALIBRATION_FRAMES samples we average them into baselineY.
  if (!isCalibrated) {
    calibrationSamples.push(y)

    if (calibrationSamples.length >= CALIBRATION_FRAMES) {
      // Average all collected standing hip positions
      const sum = calibrationSamples.reduce((a, b) => a + b, 0)
      baselineY    = sum / calibrationSamples.length
      isCalibrated = true

      console.log(`[SquatDetector] Calibrated!`)
      console.log(`  Standing hip Y = ${baselineY.toFixed(3)}`)
      console.log(`  Squat triggers when hip Y > ${(baselineY + SQUAT_THRESHOLD).toFixed(3)}`)

      // Tell the game calibration is done so Dino game transitions to ACTIVE
      window.dispatchEvent(new CustomEvent<MvCalibratedDetail>('mv:calibrated', {
        detail: { baselineY }
      }))
    }

    return  // don't run squat detection until calibration is complete
  }

  // Step two: SQUAT DETECTION
  //
  // squatDepth = how far below the standing baseline the hips currently are
  //   Positive = hips are lower than normal = player is squatting
  //   Negative = hips are higher than normal = player jumped or stood tall
  //
  // some examples:
  //   baselineY  = 0.45  (measured during calibration)
  //   current y  = 0.55
  //   squatDepth = 0.10 
  const squatDepth = y - baselineY
  const hipsAreLow = squatDepth > SQUAT_THRESHOLD
  if (hipsAreLow) {
    // Increment confirmation counter
    squatFrameCount++

    if (
      !isSquatting &&                                 // not already in a squat
      squatFrameCount >= SQUAT_CONFIRM_FRAMES &&      // held low long enough
      (now - lastSquatAt) > SQUAT_COOLDOWN_MS         // cooldown has passed
    ) {
      isSquatting = true
      lastSquatAt = now

      // DINO JUMPS when it receives this event
      window.dispatchEvent(new CustomEvent<MvSquatDetail>('mv:squat:start', {
        detail: { squatDepth: squatDepth.toFixed(3) }
      }))
      console.log(`[SquatDetector] Squat! depth=${squatDepth.toFixed(3)}`)
    }

  } else {
    // Hips are back at normal height — player stood back up
    squatFrameCount = 0  // reset the confirmation counter

    if (isSquatting) {
      isSquatting = false

      // Tell the game the player stood up
      // Useful later for "hold squat to duck" mechanics
      window.dispatchEvent(new CustomEvent('mv:squat:end'))
      console.log('[SquatDetector] Player stood up')
    }
  }
}
