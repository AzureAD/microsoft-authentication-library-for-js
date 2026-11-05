#pragma once

#include <cstdint>

namespace OneAuthPoc {
constexpr int32_t MapStatus(bool has_error, int32_t sdk_status = 0) noexcept
{
    return has_error ? (sdk_status == 0 ? -1 : sdk_status) : 0;
}
}