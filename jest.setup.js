require('@testing-library/jest-dom/extend-expect')
const Enzyme = require('enzyme')

// This is an unofficial adapter, since there's not yet an offical enzyme adapter for React 17 (2022.03.28).
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17')

Enzyme.configure({ adapter: new Adapter() })
