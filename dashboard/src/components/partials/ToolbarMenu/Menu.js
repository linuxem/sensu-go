import React from "react";
import PropTypes from "prop-types";
import EventListener from "react-event-listener";
import ResizeObserver from "react-resize-observer";
import debounce from "debounce";
import { shallowEqual } from "/utils/array";

import ButtonSet from "/components/ButtonSet";
import RootRef from "@material-ui/core/RootRef";
import MenuController from "/components/controller/MenuController";

import Menu from "./OverflowMenu";
import MenuButton from "./OverflowButton";
import MenuItem from "./Item";
import Partitioner from "./Partitioner";

const Context = React.createContext();

// Resize events are handled syncronously and can cause significant thrashing
// unless debounced.
const windowResizeInterval = 200;

class ToolbarMenu extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]).isRequired,
    width: PropTypes.number,
  };

  static defaultProps = {
    width: null,
  };

  static Item = MenuItem;

  state = {
    ids: [],
    buttonsWidth: null,
    overflowButtonWidth: 48,
  };

  // If the menu items change poison the buttons container's width, to ensure
  // that we are displaying as many buttons as possible.
  static getDerivedStateFromProps(props, state) {
    const ids = React.Children.map(props.children, child => child.props.id);
    if (!shallowEqual(ids, state.ids)) {
      return { ids, buttonsWidth: null };
    }
    return null;
  }

  componentWillUnmount() {
    this.handleWindowResize.clear();
  }

  handleResize = rect => {
    this.setState(state => {
      if (state.width === rect.width) {
        return null;
      }

      return { width: rect.width };
    });
  };

  handleButtonsResize = rect => {
    this.setState(state => {
      if (state.buttonsWidth === rect.width) {
        return null;
      }

      return { buttonsWidth: rect.width };
    });
  };

  handleWindowResize = debounce(ev => {
    const newWidth = ev.currentTarget.innerWidth;
    const oldWidth = this.windowWidth || 0;

    // If the window grew in size and the toolbar menu isn't configured to fill
    // the entire space we try rendering all the items again.
    if (!this.props.width && newWidth > oldWidth) {
      this.setState({ buttonsWidth: null }); // synchronous
    }

    this.windowWidth = newWidth;
  }, windowResizeInterval);

  buttonsWidth = () => {
    const { width } = this.props;
    const { buttonsWidth, menuWidth } = this.state;

    return buttonsWidth || width - menuWidth;
  };

  renderButtonSet = items => {
    const ctx = { collapsed: false, close: () => null };
    const buttons = (
      <ButtonSet>
        {React.Children.map(items, child => (
          <Context.Provider value={ctx}>{child}</Context.Provider>
        ))}
      </ButtonSet>
    );

    if (this.props.width === null) {
      return (
        <div style={{ position: "relative" }}>
          <ResizeObserver onResize={this.handleButtonsResize} />
          {buttons}
        </div>
      );
    }

    return buttons;
  };

  renderOverflow = items => {
    if (items.length === 0) {
      return null;
    }

    return (
      <MenuController
        renderMenu={({ anchorEl, idx, close }) => (
          <Menu id={idx} open onClose={close} anchorEl={anchorEl}>
            {React.Children.map(items, child => (
              <Context.Provider value={{ collapsed: true, close }}>
                {child}
              </Context.Provider>
            ))}
          </Menu>
        )}
      >
        {({ ref, isOpen, idx, open }) => (
          <RootRef rootRef={ref}>
            <MenuButton active={isOpen} idx={idx} onClick={open} />
          </RootRef>
        )}
      </MenuController>
    );
  };

  renderItems = partition => (
    <React.Fragment>
      {this.renderButtonSet(partition.visible)}
      {this.renderOverflow(partition.collapsed)}
    </React.Fragment>
  );

  render() {
    const items = (
      <Partitioner items={this.props.children} width={this.buttonsWidth()}>
        {this.renderItems}
      </Partitioner>
    );

    if (!this.props.width) {
      return (
        <React.Fragment>
          <EventListener target="window" onResize={this.handleWindowResize} />
          {items}
        </React.Fragment>
      );
    }

    return items;
  }
}

export { Context, ToolbarMenu as default };
