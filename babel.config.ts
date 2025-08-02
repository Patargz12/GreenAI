export default {
  presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
  plugins: [
    ...(process.env.BABEL_ENV === 'development'
      ? ['@babel/plugin-transform-react-jsx-source']
      : []),
  ],
}
