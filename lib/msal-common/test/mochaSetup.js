require("@babel/register")({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
