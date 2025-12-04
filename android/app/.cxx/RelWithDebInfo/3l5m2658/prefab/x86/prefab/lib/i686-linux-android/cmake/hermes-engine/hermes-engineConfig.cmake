if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/chiragbhatt/.gradle/caches/8.10.2/transforms/e73ab89a8e713b3941a5dba0fd779d0f/transformed/hermes-android-0.76.0-release/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/chiragbhatt/.gradle/caches/8.10.2/transforms/e73ab89a8e713b3941a5dba0fd779d0f/transformed/hermes-android-0.76.0-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

