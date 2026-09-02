import { IconButton } from "./primitives.jsx";

export default function PanelCloseButton({ onClick, label = "Close panel" }) {
  return <IconButton icon="close" label={label} variant="secondary" onClick={onClick} />;
}
