/* Compiled from js/labs/provenance-drawer.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

// provenance-drawer.jsx — the drawer behind the status chip of every figure caption (S11).
// It shows the registry entry the caption names: model, status, assumptions, validity, numerical method,
// references (DOI / arXiv / bibcode / URL links), the layer table and the seed. VizCaption (core.jsx) opens it.

var PROVENANCE_LAYER_NOTE = {
  data: "measured or tabulated",
  model: "computed from the stated equations",
  decoration: "carries no quantity; hidden in the scientific mode"
};
function ProvenanceList(_ref) {
  var title = _ref.title,
    items = _ref.items;
  return /*#__PURE__*/React.createElement("section", {
    className: "prov-section"
  }, /*#__PURE__*/React.createElement("h4", null, title), /*#__PURE__*/React.createElement("ul", null, items.map(function (item) {
    return /*#__PURE__*/React.createElement("li", {
      key: item
    }, /*#__PURE__*/React.createElement(RichText, {
      text: item
    }));
  })));
}
function ProvenanceReference(_ref2) {
  var text = _ref2.text;
  var links = window.QGA_PROVENANCE.referenceLinks(text);
  return /*#__PURE__*/React.createElement("li", null, text, links.map(function (link) {
    return /*#__PURE__*/React.createElement("a", {
      key: link.href,
      className: "prov-link",
      href: link.href,
      target: "_blank",
      rel: "noopener noreferrer"
    }, link.kind === "url" ? "link" : link.kind);
  }));
}
function ProvenanceDrawer(_ref3) {
  var id = _ref3.id,
    onClose = _ref3.onClose;
  var entry = window.QGA_PROVENANCE.get(id);
  var drawerRef = useRef(null);
  var closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(function () {
    var _drawerRef$current;
    (_drawerRef$current = drawerRef.current) === null || _drawerRef$current === void 0 || _drawerRef$current.focus();
    var onKey = function onKey(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return function () {
      return document.removeEventListener("keydown", onKey, true);
    };
  }, []);
  if (!entry) return null;
  var titleId = "prov-title-" + id;
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("aside", {
    ref: drawerRef,
    className: "prov-drawer",
    role: "dialog",
    "aria-modal": "false",
    "aria-labelledby": titleId,
    tabIndex: -1,
    "data-provenance-id": id
  }, /*#__PURE__*/React.createElement("header", {
    className: "prov-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "prov-head-id"
  }, /*#__PURE__*/React.createElement(Badge, {
    kind: entry.status
  }), /*#__PURE__*/React.createElement("span", {
    className: "prov-id"
  }, id)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "prov-close",
    onClick: onClose,
    "aria-label": "Close provenance"
  }, "\xD7")), /*#__PURE__*/React.createElement("h3", {
    id: titleId,
    className: "prov-model"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: entry.model
  })), /*#__PURE__*/React.createElement(ProvenanceList, {
    title: "Assumptions",
    items: entry.assumptions
  }), /*#__PURE__*/React.createElement(ProvenanceList, {
    title: "Validity",
    items: entry.validity
  }), /*#__PURE__*/React.createElement("section", {
    className: "prov-section"
  }, /*#__PURE__*/React.createElement("h4", null, "Numerical method"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RichText, {
    text: entry.numericalMethod
  }))), /*#__PURE__*/React.createElement("section", {
    className: "prov-section"
  }, /*#__PURE__*/React.createElement("h4", null, "References"), /*#__PURE__*/React.createElement("ul", null, entry.references.map(function (text) {
    return /*#__PURE__*/React.createElement(ProvenanceReference, {
      key: text,
      text: text
    });
  }))), /*#__PURE__*/React.createElement("section", {
    className: "prov-section"
  }, /*#__PURE__*/React.createElement("h4", null, "Layers"), /*#__PURE__*/React.createElement("table", {
    className: "prov-layers"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    scope: "col"
  }, "Layer"), /*#__PURE__*/React.createElement("th", {
    scope: "col"
  }, "Class"))), /*#__PURE__*/React.createElement("tbody", null, entry.layers.map(function (layer) {
    return /*#__PURE__*/React.createElement("tr", {
      key: layer.name,
      "data-layer-class": layer["class"]
    }, /*#__PURE__*/React.createElement("td", null, layer.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "prov-class prov-class-" + layer["class"]
    }, layer["class"]), " ", PROVENANCE_LAYER_NOTE[layer["class"]]));
  })))), /*#__PURE__*/React.createElement("section", {
    className: "prov-section"
  }, /*#__PURE__*/React.createElement("h4", null, "Seed"), /*#__PURE__*/React.createElement("p", {
    className: "prov-seed"
  }, entry.seed))), document.body);
}