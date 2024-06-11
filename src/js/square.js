/**
 * A square
 *
 * @param {string} heading The heading of the square
 * @param {Object} props Properties of the square
 * @param {boolean} props.isSearch Whether the square is a search square
 * @param {boolean} [props.options] The search options
 * @param {boolean} [props.prefix] The search prefix
 * @param {boolean} [props.links] The square links
 * @param {Object} configBool The global boolean config options
 * @param {Object} configStyle The global style config options
 */
function Square(heading, props, configBool, configStyle) {
  this.heading = heading;
  this.props = props;
  this.border_width_hovered = configStyle.border_width_hovered;
  this.border_width_normal = configStyle.border_width_normal;
  this.focus_color = configStyle.focus_color;
  this.focus_bg_color = configStyle.focus_bg_color;
  this.link_color = configStyle.link_color;
  this.isAlwaysopen = configBool.alwaysopen;
  this.hasBorders = configBool.borders;
  // Make sure size has a unit
  let size = configStyle.square_size;
  this.size = isNaN(size) ? size.substr(0, size.length-2) : size;
  this.sizeUnit = isNaN(size) ?  size.substr(-2) : "px";

  this.squareElement = document.createElement("div");
  this.squareElement.setAttribute("class", "sqr");

  this.headingElement = document.createElement("span");
  const headingTextnode = document.createTextNode(this.heading);
  this.headingElement.appendChild(headingTextnode);

  this.contentElement = document.createElement("div");
  this.contentElement.setAttribute("class", "content");

  this.linkElements = [];
  if(!this.props.isSearch) {
    for (let i = 0; i < this.props.links.length; i++) {
      var div = document.createElement("div");
      var icon = document.createElement("img");
      var link = document.createElement("a");

      var iconUrl = function(url){
        var ico = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i)[1].split('.').slice(-3).join('.');
        var icoUrl = "https://www.google.com/s2/favicons?domain="+ico;

        return icoUrl;
      };

      div.setAttribute("id", "linkItem");
      icon.setAttribute("src", iconUrl(this.props.links[i].url));
      link.setAttribute("href", this.props.links[i].url);

      div.appendChild(icon);
      div.appendChild(link);
      const textnode = document.createTextNode(this.props.links[i].name);
      link.appendChild(textnode);

      this.linkElements[i] = div;
      this.linkElements[i].tabIndex = "-1";  
      this.contentElement.appendChild(this.linkElements[i]);
      this.contentElement.appendChild(document.createElement("br"));
    }
  } else {
    this.squareElement.setAttribute("id", "search_sqr");
    this.searchinput = document.createElement("input");
    this.searchinput.tabIndex = "-1";
    this.searchinput.setAttribute("id", "searchinput");
    this.searchinput.setAttribute("autocomplete", "off");

    this.contentElement.appendChild(this.searchinput);

    this.popup;
    const constructPopup = () => {
      let opts = [];
      for (const option of this.props.options) {
        // Remove scheme, path and everything after path from URL
        const url = option.url.replace(/https?:\/\//, "").replace(/\/.*/, "");
        opts.push({
          opt: option.opt,
          description: url
        });
      }
      const bottomText = "startpage v" + browser.runtime.getManifest().version;
      this.popup = new Popup(this.props.prefix, opts, bottomText, {
        background: configStyle.foreground,
        color: configStyle.link_color,
        fontFamily: configStyle.link_font,
        fontSize: configStyle.link_font_size
      });
    }
    const searchEnter = (event) => {
      const key = event.keyCode;
      if(key == 13) {
        const query = this.searchinput.value;
        if(query[0] == this.props.prefix) {
          if(query.substr(1) == "help") {
            if(this.popup === undefined) constructPopup();
            // Have to requestAnimationFrame here because otherwise we're
            // calling toggle too fast and the transition won't fire
            window.requestAnimationFrame(() => this.popup.toggle())
          } else if(query.substr(1) == "config") {
            configmenuInit(undefined);
          } else {
            for(const option of this.props.options) {
              if(query[1] == option.opt) {
                query = query.substr(3);
                window.location = option.url +
                    query.replaceChars(" ", option.space);
                break;
              }
            }
          }
        } else if(query === "") {
            if(this.popup === undefined) constructPopup();
            window.requestAnimationFrame(() => this.popup.toggle())
        } else {
          window.location = this.props.options[0].url +
              query.replaceChars(" ", this.props.options[0].space);
        }
      }
    };
    const searchFocused = (this.searchinput == document.activeElement);
    this.searchinput.addEventListener("keydown", searchEnter);
  }


  this.squareElement.appendChild(this.headingElement);
  this.squareElement.appendChild(this.contentElement);
  document.getElementById("container").appendChild(this.squareElement);

  if(!this.isAlwaysopen) {
    const square = this;
    this.squareElement.addEventListener("mouseover", this.expand.bind(this),
                                        false);
    this.squareElement.addEventListener("mouseout", this.contract.bind(this),
                                        false);
  }
}


// TODO: Calculate maxHeight once on construction instead of on every call to
// expand
Square.prototype.maxHeight = function() {
  return this.size*2 + (this.props.isSearch ? 37 :
    (parseFloat(getComputedStyle(this.linkElements[0]).height)
    +2*parseFloat(getComputedStyle(this.linkElements[0]).paddingTop))*this.props.links.length);
}

Square.prototype.expand = function() {
  if(this.isAlwaysopen) return;
  this.squareElement.style.height = this.maxHeight() + this.sizeUnit;
  if(this.hasBorders) {
    this.squareElement.style.borderWidth = this.border_width_hovered;
  }
};

Square.prototype.contract = function() {
  if(this.isAlwaysopen) return;
  this.squareElement.style.height = this.size + this.sizeUnit;
  this.squareElement.style.borderWidth = this.border_width_normal;
};

Square.prototype.focus = function(index) {
  this.contentElement.childNodes[index*2].style.backgroundColor =
      this.focus_bg_color;
  this.contentElement.childNodes[index*2].style.color = this.focus_color;
};

Square.prototype.unfocus = function(index) {
  this.contentElement.childNodes[index*2].style.backgroundColor = "initial";
  this.contentElement.childNodes[index*2].style.color = this.link_color;
};
