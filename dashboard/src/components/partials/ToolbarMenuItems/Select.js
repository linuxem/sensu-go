import React from "react";
import PropTypes from "prop-types";

import { Context } from "/components/partials/ToolbarMenu";
import { Option, Controller } from "/components/partials/ToolbarSelect";

import Disclosure from "./Disclosure";

class Select extends React.Component {
  static displayName = "ToolbarMenuItems.Select";

  static propTypes = {
    autoClose: PropTypes.bool,
    children: PropTypes.node,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    autoClose: true,
    children: [],
    onChange: () => false,
  };

  render() {
    const {
      autoClose,
      children,
      onChange: onChangeProp,
      ...props
    } = this.props;

    return (
      <Context.Consumer>
        {({ close: closeProp }) => {
          const close = autoClose ? closeProp : () => null;

          let onChange = onChangeProp;
          if (autoClose) {
            onChange = val => {
              onChangeProp(val);
              closeProp();
            };
          }

          return (
            <Controller onChange={onChange} onClose={close} options={children}>
              {ctrl => <Disclosure {...props} onClick={ctrl.open} />}
            </Controller>
          );
        }}
      </Context.Consumer>
    );
  }
}

export { Select as default, Option };
