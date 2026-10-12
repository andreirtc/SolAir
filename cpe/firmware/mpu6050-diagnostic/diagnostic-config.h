#pragma once

// UNCONFIRMED. No example/default pins are approved wiring.
// Hardware lead must supply GPIO numbers (not header positions), AD0/address,
// exact board/module identity, supply/logic/pull-up compatibility and sign-off.
constexpr bool WIRING_CONFIRMED = false;
constexpr int SDA_GPIO = -1;
constexpr int SCL_GPIO = -1;
constexpr int SENSOR_ADDRESS = -1; // Deliberately choose 0x68 or 0x69 after AD0 review.
constexpr unsigned long I2C_CLOCK_HZ = 100000; // Diagnostic software choice.
constexpr unsigned long PRINT_INTERVAL_MS = 500;
