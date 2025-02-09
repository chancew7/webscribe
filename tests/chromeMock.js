const chrome = {
    runtime: {
      onMessage: {
        addListener: jest.fn()
      }
    }
  };
  
  global.chrome = chrome;
  