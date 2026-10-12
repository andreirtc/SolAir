export type ForecastInput = {
  batteryVoltage: number | null;
  batteryCurrent: number | null;
  validatedStateOfCharge: number | null;
  modelVersion: string | null;
};
export type Forecast =
  | { available: false; reason: string }
  | {
      available: true;
      minutes: number;
      modelVersion: string;
      validationReport: string;
    };
export interface ValidatedForecastModel {
  predict(input: ForecastInput): Forecast;
}
export function forecastBattery(
  _input: ForecastInput,
  model?: ValidatedForecastModel,
): Forecast {
  return model
    ? model.predict(_input)
    : {
        available: false,
        reason: "Insufficient validated battery data and no validated model",
      };
}
