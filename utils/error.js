// Compatibility wrapper: re-export from the implementation module
export * from './error_impl';

// Provide a default namespace export for callers that use default imports
import * as _impl from './error_impl';
export default _impl;