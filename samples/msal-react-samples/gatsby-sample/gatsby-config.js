/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/gatsby-config/
 */

if (process.env.E2E) {
    require("dotenv").config({
        path: `.env.e2e`,
    })
} else {
    require("dotenv").config({
        path: `.env.${process.env.NODE_ENV}`,
    })
}

module.exports = {
    siteMetadata: {
        title: "MSAL-React Gatsby Sample"
    }
}
