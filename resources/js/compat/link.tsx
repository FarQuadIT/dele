import { Link, type InertiaLinkProps } from '@inertiajs/react';
type Props = InertiaLinkProps & { href: string; scroll?: boolean };
export default function AppLink({prefetch: _prefetch, scroll: _scroll, replace, ...props}: Props) {
  if (props.href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(props.href)) return <a href={props.href} className={props.className} target={props.target} rel={props.rel} aria-label={props['aria-label']} onClick={props.onClick}>{props.children}</a>;
  return <Link {...props} replace={replace}/>;
}
