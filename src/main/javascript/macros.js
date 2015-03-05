"use strict";

// by convention, I will use the _ character to represent the object currently 
// being defined

#ifdef  DEBUG

#define LOG(x)      console.log(x)
#define DEBUGGER    debugger

#else

#define LOG(x)
#define DEBUGGER    debugger

#endif
