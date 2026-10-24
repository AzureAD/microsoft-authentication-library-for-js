#include "../status_mapping.h"

static_assert(OneAuthPoc::MapStatus(true, 0) == -1);
static_assert(OneAuthPoc::MapStatus(true, 1) == 1);
static_assert(OneAuthPoc::MapStatus(true, 2) == 2);
static_assert(OneAuthPoc::MapStatus(true, 3) == 3);
static_assert(OneAuthPoc::MapStatus(true, 7) == 7);
static_assert(OneAuthPoc::MapStatus(true, 8) == 8);
static_assert(OneAuthPoc::MapStatus(true, 17) == 17);
static_assert(OneAuthPoc::MapStatus(false) == 0);
static_assert(OneAuthPoc::MapStatus(false, 2) == 0);

constexpr bool AllSdkErrorsAreFailures()
{
    for (int32_t status = 0; status <= 255; ++status)
    {
        if (OneAuthPoc::MapStatus(true, status) == 0) return false;
        if (status != 0 && OneAuthPoc::MapStatus(true, status) != status) return false;
    }
    return true;
}

static_assert(AllSdkErrorsAreFailures());