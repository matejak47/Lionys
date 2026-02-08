// Přidáme prop 'variant', která může být 'primary' (výchozí) nebo 'danger'
const Button = ({ children, type = "button", onClick, disabled = false, variant = "primary", style }) => {
  
  // Rozhodneme, jakou barvu použít
  const className = `btn ${variant === 'danger' ? 'btn-danger' : ''}`;

  return (
    <button 
      type={type} 
      className={className} 
      onClick={onClick} 
      disabled={disabled}
      style={style} // Abychom mohli případně měnit šířku (maxWidth)
    >
      {children}
    </button>
  );
};

export default Button;