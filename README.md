<div style="display: flex; align-items: center;">
  <img src="https://res.cloudinary.com/ddlhtsgmp/image/upload/w_150,h_150,c_fill,r_max/v1757419888/yc-startup-map-logo.png" alt="YC Startup Map Logo" style="margin-right: 16px;"/>
  <div>
    <h1>YC Startup Map</h1>
    <p>A map visualization of the <a href="https://www.ycombinator.com/companies" target="_blank">YC Startup Directory</a></p>
    <img src="https://img.shields.io/github/actions/workflow/status/brysonbw/ycstartupmap.com/ci.yml?branch=main&style=flat&logo=github&label=CI" alt="CI"/> <img src="https://img.shields.io/badge/PRs-Welcome-green" alt="PRs Welcome" /> <img src="https://img.shields.io/badge/Apache_2.0-license-blue" alt="Apache 2.0 License"/> 
  </div>
</div>

---

## About

### How this project began

I wanted to explore the [YC Startup Directory](https://www.ycombinator.com/companies) through a map visualization. Since the official [Y Combinator(aka YC) website](https://www.ycombinator.com/) doesn’t currently offer one, I decided to build a version that I would personally enjoy using as an end user.

I started by building a [web scraper](https://github.com/brysonbw/yc-scraper) to collect the data you see on the map.

I used [Google Places (new) API](https://developers.google.com/maps/documentation/places/web-service/overview) to fetch coordinates and addresses for
the companies, enabling them to be plotted on the map.

This project is built with [Lit](https://lit.dev/) and using [CesiumJS](https://cesium.com/platform/cesiumjs/) for the map.

## Contributing

If you have suggestions for how this project could be improved, or want to report a bug, feel free to open an issue! We welcome all contributions.

Likewise, before contributing please read and complete the [contribution guide](CONTRIBUTING.md).

## Resources

- [Changelog](CHANGELOG.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## License

[Apache 2.0](LICENSE)
