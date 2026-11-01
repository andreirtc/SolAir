import type { Telemetry } from '../packages/telemetry-contract';

/** Read-only display conversion. Never write this estimate into telemetry or energy inputs. */
export function acsUncalibratedDisplay(t: Telemetry | null, reportFresh: boolean) {
  const a=t?.cpe?.acs;
  if (!reportFresh || t?.source_type!=='hardware' || !t.cpe || t.cpe.historical || a?.quality!=='uncalibrated') return null;
  const output=t.acs_output_v, zero=a.zero_v, sensitivity=a.sensitivity_v_per_a;
  // Use the device's reconstructed output, not an invented divider ratio or automatic tare.
  if (typeof output!=='number' || !Number.isFinite(output) || output<0 || output>5.5 ||
      typeof zero!=='number' || !Number.isFinite(zero) || zero<0 || zero>5.5 ||
      typeof sensitivity!=='number' || !Number.isFinite(sensitivity) || sensitivity<=0 ||
      typeof a.adc_mv!=='number' || !Number.isFinite(a.adc_mv) || a.adc_mv<=20 || a.adc_mv>=3250 ||
      typeof a.adc_age_ms!=='number' || a.adc_age_ms<0 || a.adc_age_ms>500 ||
      !a.adc_source || !a.adc_diagnostic?.startsWith('ok')) return null;
  const currentA=(output-zero)/sensitivity;
  if (!Number.isFinite(currentA) || Math.abs(currentA)>50) return null;
  return {currentA,outputV:output,zeroV:zero,sensitivityVPerA:sensitivity};
}
