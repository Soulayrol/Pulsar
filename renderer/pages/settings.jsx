import electron from 'electron';
import React from 'react';
import Head from 'next/head';

import Nav from '../components/Nav';

import "../styles/settings.sass"

const ipcRenderer = electron.ipcRenderer || false;

export default class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: {},
      theme: "light",
      primaryColor: "blue",
      saveShortcut: "",
      incrementShortcut: "",

      navOpen: false,

      selectedTab: 0,

      tabs: [
        {
          "title": "Projects",
          "icon" : "la-archive",
          "render": this.renderProjectTab()
        },
        {
          "title": "Theme",
          "icon": "la-palette",
          "render": this.renderThemeTab()
        },
        {
          "title": "Overlay",
          "icon": "la-window-restore",
          "render": this.renderOverlayTab()
        }
      ]
    };
  }

  componentDidMount() {
    console.log("----- Component mounted -----");
    if(ipcRenderer) {
      ipcRenderer.send("getConfig");

      ipcRenderer.on('config', (event, data) => {
        console.log("----- receive config file -----", data);
        this.setState({config: data})
        if(data.theme) {
          console.log(data.theme);
          this.setState({theme: data.theme});
        }
        if(data.color) {
          this.setState({primaryColor: data.color});
        }
        if(data.overlay.save) {
          this.setState({saveShortcut: data.overlay.save})
        }
        if(data.overlay.increment) {
          this.setState({incrementShortcut: data.overlay.increment})
        }
      });
    }
  }

  renderProjectTab() {
    return (
      <div>
        <h1 className="display-4">Projects</h1>
      </div>
    );
  }

  renderThemeTab() {
    return (
      <div>
        <h1 className="display-4">Theme</h1>
      </div>
    );
  }

  renderOverlayTab() {
    return (
      <div>
        <h1 className="display-4">Overlay</h1>
      </div>
    );
  }

  render() {

    return (
      <React.Fragment>
        <Head>
          <title>Pulsar</title>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <link href="https://fonts.googleapis.com/css?family=Oswald&display=swap" rel="stylesheet"/>
          <link href="https://fonts.googleapis.com/css?family=Big+Shoulders+Text:400,500,700&display=swap" rel="stylesheet"/>
          {/* <link href="./static/fontawesome/css/all.css" rel="stylesheet"/> */}
          <link href="./static/line-awesome/css/line-awesome.min.css" rel="stylesheet"/>
        </Head>

        <Nav
          theme={this.state.theme}
          open={this.state.navOpen}
          page="settings"
          toggleNav={(v) => this.setState({navOpen: v})}
        />

        <div className={this.state.navOpen ? `main theme-${this.stat}` : "main full"}>
          <div className="settings-page-title">
            <h1 className="display-1">Settings</h1>
          </div>
          <div className="settings-container">
            <div className="settings-sidebar">
              <div className="nav-menu">
                {this.state.tabs.map((tab, index) => (
                  <div key={index} className="nav-item icon" onClick={(e) => this.setState({selectedTab: index})}>
                    <i className={"las " + tab.icon}></i>
                    <div className="nav-item-title">{tab.title}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-main">
              {this.state.tabs[this.state.selectedTab].render}
            </div>
          </div>
        </div>



        <style jsx global>{`

        `}</style>
        <style jsx>{`

        `}</style>
      </React.Fragment>
    );
  };
};
