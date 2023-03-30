import * as React from "react";

export interface HeroListItem {
  icon: string;
  primaryText: string;
}

export interface HeroListProps {
  message: string;
  items: HeroListItem[];
  children: any;
}

export default class HeroList extends React.Component<HeroListProps> {
  render() {
    const { children, items, message } = this.props;

    const listItems = items.map((item, index) => (
      <li className="ms-ListItem" key={index}>
        <i className={`ms-Icon ms-Icon--${item.icon}`}></i>
        <span className="ms-font-m ms-fontColor-neutralPrimary">{item.primaryText}</span>
      </li>
    ));
    return (
      <main className="ms-welcome__main">
        <h2 className="ms-font-xl ms-fontWeight-semilight ms-fontColor-neutralPrimary ms-u-slideUpIn20">{message}</h2>
        <ul className="ms-List ms-welcome__features ms-u-slideUpIn10">{listItems}</ul>
        {children}
      </main>
    );
  }
}
