function Loader({ text = "Loading..." }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <div className="loader" />
      <p>{text}</p>
    </div>
  );
}

export default Loader;
