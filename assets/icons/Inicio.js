import Svg, { G, Path } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: style */
const Inicio = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      enableBackground: "new 0 0 100 100",
    }}
    viewBox="0 0 100 100"
    {...props}
  >
    <G id="ICONOS_MENU_INFERIOR_00000147201199370912135440000014228895191147869577_">
      <G id="HOME">
        <Path
          d="M60.8 60.8h-22v23.9h3.7V64.4h14.6v20.3h3.7V60.8z"
          className="st4"
        />
        <Path
          d="M49.5 15.7 12.1 38.9v45.8H16V40.5l33.5-20.8 33.6 20.8v44.2H87V38.9z"
          className="st4"
        />
      </G>
    </G>
  </Svg>
);
export default Inicio;
