module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [/Failed to parse source map/],
    },
  },
  eslint: {
    enable: false,
  },
};
