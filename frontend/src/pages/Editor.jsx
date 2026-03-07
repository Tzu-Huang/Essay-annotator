function Editor() {
  return (
    <div style={{ padding: "40px" }}>

      {/* Essay Type */}
      <div style={{ marginBottom: "20px" }}>
        <label>Essay type </label>

        <select>
          <option>CommonApp</option>
          <option>UC</option>
          <option>Supplemental</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "40px" }}>

        {/* Input */}
        <div style={{ flex: 1 }}>
          <h3>input</h3>

          <textarea
            style={{ width: "100%", height: "300px" }}
          />

          <button className="primary-btn">
            Generate
          </button>
        </div>

        {/* Output */}
        <div style={{ flex: 1 }}>
          <h3>output</h3>

          <div
            style={{
              border: "1px solid #ccc",
              height: "350px",
              padding: "10px"
            }}
          >
            result appears here
          </div>
        </div>

      </div>

    </div>
  );
}

export default Editor;