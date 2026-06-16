import { useState, useMemo } from 'react'
import modelData from './model_params.json'
import './App.css'

function App() {
  // 1. State Management
  const [kValue, setKValue] = useState(5);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(false);
  
  // Predictor inputs
  const [inputIncome, setInputIncome] = useState(50);
  const [inputScore, setInputScore] = useState(50);
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // 2. Load Active Model Parameters based on Selected K
  const currentModel = useMemo(() => {
    return modelData[kValue.toString()] || modelData["5"];
  }, [kValue]);

  const { centroids, cluster_metadata: clusterMetadata, data_points: dataPoints } = currentModel;
  const totalPoints = dataPoints.length;

  const toggleTheme = () => {
    setIsLightTheme(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      return next;
    });
  };

  // Data Explorer Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [tableClusterFilter, setTableClusterFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const itemsPerPage = 10;

  // 3. SVG Coordinate Projection Dimensions & Scales
  const svgWidth = 800;
  const svgHeight = 480;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  // Calculate scales (Income range: 15-137, Score range: 1-99)
  const xMin = 0;
  const xMax = 150;
  const yMin = 0;
  const yMax = 105;

  const getSvgX = (income) => {
    return margin.left + ((income - xMin) / (xMax - xMin)) * (svgWidth - margin.left - margin.right);
  };

  const getSvgY = (score) => {
    return svgHeight - margin.bottom - ((score - yMin) / (yMax - yMin)) * (svgHeight - margin.top - margin.bottom);
  };

  // Convert SVG coordinates back to data coordinates for custom interactive clicking (Optional premium feature)
  const getDataCoords = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Reverse calculation
    const plotWidth = svgWidth - margin.left - margin.right;
    const plotHeight = svgHeight - margin.top - margin.bottom;
    
    const pctX = (clickX - margin.left) / plotWidth;
    const pctY = (svgHeight - margin.bottom - clickY) / plotHeight;
    
    const inc = Math.round(xMin + pctX * (xMax - xMin));
    const scr = Math.round(yMin + pctY * (yMax - yMin));
    
    if (inc >= 15 && inc <= 137 && scr >= 1 && scr <= 99) {
      setInputIncome(inc);
      setInputScore(scr);
    }
  };

  // 4. K-Means Prediction Engine (Euclidean Distance Model)
  const runPrediction = () => {
    setIsPredicting(true);
    
    // Simulate slight model computation latency for premium UX feel
    setTimeout(() => {
      let minDistance = Infinity;
      let predictedClusterIdx = 0;
      const distanceDetails = [];

      centroids.forEach((centroid, idx) => {
        const [centIncome, centScore] = centroid;
        // Euclidean distance calculation: sqrt((x1-x2)^2 + (y1-y2)^2)
        const dist = Math.sqrt(
          Math.pow(inputIncome - centIncome, 2) + 
          Math.pow(inputScore - centScore, 2)
        );
        
        distanceDetails.push({
          cluster: idx,
          name: clusterMetadata[idx].name,
          distance: dist.toFixed(2)
        });

        if (dist < minDistance) {
          minDistance = dist;
          predictedClusterIdx = idx;
        }
      });

      const clusterInfo = clusterMetadata[predictedClusterIdx];
      setPrediction({
        clusterIdx: predictedClusterIdx,
        name: clusterInfo.name,
        desc: clusterInfo.desc,
        color: clusterInfo.color,
        income: inputIncome,
        score: inputScore,
        distances: distanceDetails
      });
      setIsPredicting(false);
    }, 450);
  };

  const handleResetPrediction = () => {
    setPrediction(null);
  };

  // 5. Data Explorer Table Operations
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = dataPoints.map((item, index) => ({
      id: index + 1,
      ...item
    }));

    // Filter by cluster
    if (tableClusterFilter !== 'all') {
      result = result.filter(item => item.cluster === parseInt(tableClusterFilter, 10));
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        const cInfo = clusterMetadata[item.cluster];
        return (
          item.id.toString().includes(query) ||
          item.income.toString().includes(query) ||
          item.score.toString().includes(query) ||
          cInfo.name.toLowerCase().includes(query) ||
          cInfo.desc.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    if (sortConfig.key !== null) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // Handle sorting by cluster metadata name
        if (sortConfig.key === 'clusterName') {
          valA = clusterMetadata[a.cluster].name;
          valB = clusterMetadata[b.cluster].name;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [dataPoints, tableClusterFilter, searchQuery, sortConfig, clusterMetadata]);

  // Pagination calculations
  const totalFilteredItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // 6. Cluster Aggregated Statistics
  const clusterStats = useMemo(() => {
    const stats = {};
    // Initialize
    Object.keys(clusterMetadata).forEach(key => {
      stats[key] = {
        count: 0,
        sumIncome: 0,
        sumScore: 0,
        ...clusterMetadata[key]
      };
    });

    // Accumulate
    dataPoints.forEach(pt => {
      if (stats[pt.cluster]) {
        stats[pt.cluster].count += 1;
        stats[pt.cluster].sumIncome += pt.income;
        stats[pt.cluster].sumScore += pt.score;
      }
    });

    // Average
    Object.keys(stats).forEach(key => {
      const c = stats[key].count;
      stats[key].avgIncome = c > 0 ? (stats[key].sumIncome / c).toFixed(1) : 0;
      stats[key].avgScore = c > 0 ? (stats[key].sumScore / c).toFixed(1) : 0;
      stats[key].percentage = ((c / totalPoints) * 100).toFixed(1);
    });

    return stats;
  }, [dataPoints, clusterMetadata, totalPoints]);

  // Precomputed WCSS values for the Elbow Method Visualizer
  const elbowData = [
    { k: 1, wcss: 263000, desc: "High Variance" },
    { k: 2, wcss: 181000, desc: "Tension Point" },
    { k: 3, wcss: 106000, desc: "Optimal Shift" },
    { k: 4, wcss: 73000, desc: "Intermediate Shift" },
    { k: 5, wcss: 44000, desc: "Optimal (Elbow)", optimal: true },
    { k: 6, wcss: 37200, desc: "Diminishing Returns" },
    { k: 7, wcss: 30100, desc: "Marginal Utility" },
    { k: 8, wcss: 25000, desc: "Overclustering" }
  ];

  // Specific marketing recommendations based on segment names
  const getBusinessStrategy = (name) => {
    const strategies = {
      "Average Customers": "Standard advertising, seasonal mailers, loyalty tier activation to increase visits.",
      "Target Customers": "VIP newsletters, personal shoppers, early access product drops, premium rewards.",
      "Careless Spenders": "Impulse buys at checkouts, highly active social media discount campaigns, referral vouchers.",
      "Careful Spenders": "Cashback alerts, premium bundle packages, highlighting value propositions and durability.",
      "Sensible Customers": "Utility-focused campaigns, essential items discounts, low-barrier loyalty registration.",
      "Affluent Moderates": "Exclusive pre-sales, premium upgrades, tailored advisory services.",
      "Budget Moderates": "Discount packages, targeted value alerts, loyalty point boosts.",
      "Active Spenders": "Flash sales, bundle discounts, social media engagement rewards.",
      "Frugal Average": "Value-for-money packages, coupons, marketing campaigns.",
      "Standard Customers": "Standard promotional emails, basic newsletter updates, periodic sales alerts."
    };
    return strategies[name] || "Standard marketing outreach and seasonal offers.";
  };

  return (
    <div className="container">
      {/* 1. Sticky Navigation Header */}
      <header className="sticky-header">
        <div className="brand-section">
          <h1>TargetCust.ai</h1>
          <p>Enterprise Customer Segmentation Dashboard</p>
        </div>
        <div className="header-controls">
          <nav className="nav-links">
            <a href="#plot-section" className="nav-link">Scatter Plot</a>
            <a href="#profiles-section" className="nav-link">Segment Profiles</a>
            <a href="#explorer-section" className="nav-link">Data Explorer</a>
          </nav>
          
          {/* K-Value Selection control in the header */}
          <div className="k-select-panel" title="Choose K clusters">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 0.4rem' }}>K:</span>
            {[2, 3, 4, 5, 6, 7, 8].map((k) => (
              <button
                key={k}
                type="button"
                className={`btn-k-select ${kValue === k ? 'active' : ''}`}
                onClick={() => {
                  setKValue(k);
                  setSelectedCluster(null);
                  setPrediction(null);
                }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Theme Toggle Button */}
          <button 
            type="button"
            className="btn-theme-toggle" 
            onClick={toggleTheme}
            title={isLightTheme ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLightTheme ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 2. Key Performance Indicators */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="metric-info">
            <h3>Total Database Size</h3>
            <p>{totalPoints} Customers</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-container" style={{ color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <div className="metric-info">
            <h3>Active Segments (K)</h3>
            <p>{kValue} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}> (Optimal: 5)</span></p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-container" style={{ color: '#f59e0b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="metric-info">
            <h3>Algorithm Metric</h3>
            <p>Within-Cluster Variance</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-container" style={{ color: '#f43f5e' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="metric-info">
            <h3>Dimension Profile</h3>
            <p>2D (Income vs. Score)</p>
          </div>
        </div>
      </div>

      {/* 3. Main Plot & Predictor Workspace */}
      <div className="workspace-grid">
        {/* Left Card: Custom SVG Scatter Plot */}
        <div className="glass-card plot-card" id="plot-section">
          <div className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Interactive Customer Segments Plot
          </div>
          
          <div className="plot-legend">
            <div 
              className={`legend-item ${selectedCluster === null ? 'active' : 'dimmed'}`}
              onClick={() => setSelectedCluster(null)}
            >
              <span className="legend-color" style={{ background: '#cbd5e1', border: '1px solid rgba(255,255,255,0.2)' }}></span>
              <span>All Customers</span>
            </div>
            {Object.keys(clusterMetadata).map(key => {
              const info = clusterMetadata[key];
              return (
                <div 
                  key={key}
                  className={`legend-item ${selectedCluster === parseInt(key, 10) ? 'active' : selectedCluster !== null ? 'dimmed' : ''}`}
                  onClick={() => setSelectedCluster(parseInt(key, 10))}
                >
                  <span className="legend-color" style={{ background: info.color }}></span>
                  <span>{info.name}</span>
                </div>
              );
            })}
          </div>

          <div className="plot-container">
            <svg 
              className="svg-plot" 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onClick={getDataCoords}
              style={{ cursor: 'crosshair' }}
            >
              {/* Horizontal Grid lines */}
              {[0, 20, 40, 60, 80, 100].map(val => (
                <g key={`y-grid-${val}`}>
                  <line 
                    x1={margin.left} 
                    y1={getSvgY(val)} 
                    x2={svgWidth - margin.right} 
                    y2={getSvgY(val)} 
                    className="plot-grid-line"
                  />
                  <text 
                    x={margin.left - 12} 
                    y={getSvgY(val) + 4} 
                    textAnchor="end" 
                    className="plot-axis-label"
                  >
                    {val}
                  </text>
                </g>
              ))}

              {/* Vertical Grid lines */}
              {[0, 20, 40, 60, 80, 100, 120, 140].map(val => (
                <g key={`x-grid-${val}`}>
                  <line 
                    x1={getSvgX(val)} 
                    y1={margin.top} 
                    x2={getSvgX(val)} 
                    y2={svgHeight - margin.bottom} 
                    className="plot-grid-line"
                  />
                  <text 
                    x={getSvgX(val)} 
                    y={svgHeight - margin.bottom + 20} 
                    textAnchor="middle" 
                    className="plot-axis-label"
                  >
                    {val}
                  </text>
                </g>
              ))}

              {/* X Axis Line */}
              <line 
                x1={margin.left} 
                y1={svgHeight - margin.bottom} 
                x2={svgWidth - margin.right} 
                y2={svgHeight - margin.bottom} 
                className="plot-axis-line"
              />

              {/* Y Axis Line */}
              <line 
                x1={margin.left} 
                y1={margin.top} 
                x2={margin.left} 
                y2={svgHeight - margin.bottom} 
                className="plot-axis-line"
              />

              {/* Axis Labels */}
              <text 
                x={margin.left + (svgWidth - margin.left - margin.right) / 2} 
                y={svgHeight - 15} 
                textAnchor="middle" 
                className="plot-axis-label"
                style={{ fontWeight: 600, fill: 'var(--text-primary)' }}
              >
                Annual Income (₹k)
              </text>

              <text 
                x={18} 
                y={margin.top + (svgHeight - margin.top - margin.bottom) / 2} 
                textAnchor="middle" 
                className="plot-axis-label"
                transform={`rotate(-90, 18, ${margin.top + (svgHeight - margin.top - margin.bottom) / 2})`}
                style={{ fontWeight: 600, fill: 'var(--text-primary)' }}
              >
                Spending Score (1 - 100)
              </text>

              {/* Click mapping guide text */}
              <text 
                x={svgWidth - margin.right} 
                y={margin.top - 15} 
                textAnchor="end" 
                className="plot-title"
              >
                * TIP: Click anywhere on chart canvas to place coordinates into predictor form
              </text>

              {/* Draw Data Points */}
              {dataPoints.map((pt, index) => {
                const isDimmed = selectedCluster !== null && pt.cluster !== selectedCluster;
                const color = clusterMetadata[pt.cluster].color;
                const cx = getSvgX(pt.income);
                const cy = getSvgY(pt.score);

                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={color}
                    className={`dot ${isDimmed ? 'dimmed' : ''}`}
                    onMouseEnter={() => setHoveredPoint({
                      type: 'customer',
                      id: index + 1,
                      income: pt.income,
                      score: pt.score,
                      clusterName: clusterMetadata[pt.cluster].name,
                      clusterColor: color,
                      svgX: cx,
                      svgY: cy
                    })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}

              {/* Draw Cluster Centroids */}
              {centroids.map((centroid, idx) => {
                const [income, score] = centroid;
                const cx = getSvgX(income);
                const cy = getSvgY(score);
                const color = clusterMetadata[idx].color;
                const isDimmed = selectedCluster !== null && idx !== selectedCluster;

                return (
                  <g 
                    key={`centroid-${idx}`} 
                    className={`centroid ${isDimmed ? 'dimmed' : ''}`}
                    onMouseEnter={() => setHoveredPoint({
                      type: 'centroid',
                      clusterIdx: idx,
                      income: income.toFixed(1),
                      score: score.toFixed(1),
                      clusterName: `${clusterMetadata[idx].name} (Centroid)`,
                      clusterColor: color,
                      svgX: cx,
                      svgY: cy
                    })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Centroid outer circle indicator */}
                    <circle cx={cx} cy={cy} r={12} fill="none" stroke={color} strokeWidth={2} strokeDasharray="3 3" />
                    {/* Inner core */}
                    <circle cx={cx} cy={cy} r={6} fill={color} stroke="#ffffff" strokeWidth={1.5} />
                  </g>
                );
              })}

              {/* Draw Predicted Custom Point */}
              {prediction && (
                <g>
                  {/* Pulsing ring indicator */}
                  <circle 
                    cx={getSvgX(prediction.income)} 
                    cy={getSvgY(prediction.score)} 
                    r={18} 
                    className="pulse-ring"
                    style={{ stroke: prediction.color }}
                  />
                  {/* Point itself */}
                  <circle
                    cx={getSvgX(prediction.income)}
                    cy={getSvgY(prediction.score)}
                    r={8}
                    className="predicted-dot"
                    style={{ stroke: prediction.color }}
                    onMouseEnter={() => setHoveredPoint({
                      type: 'prediction',
                      income: prediction.income,
                      score: prediction.score,
                      clusterName: `Predicted: ${prediction.name}`,
                      clusterColor: prediction.color,
                      svgX: getSvgX(prediction.income),
                      svgY: getSvgY(prediction.score)
                    })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              )}
            </svg>

            {/* Custom Styled Tooltip */}
            {hoveredPoint && (
              <div 
                className="plot-tooltip"
                style={{
                  left: `${hoveredPoint.svgX + 15}px`,
                  top: `${hoveredPoint.svgY - 70}px`,
                  borderColor: hoveredPoint.clusterColor
                }}
              >
                <div className="tooltip-title" style={{ color: hoveredPoint.clusterColor }}>
                  {hoveredPoint.clusterName}
                </div>
                {hoveredPoint.id && (
                  <div className="tooltip-row">
                    <span>Customer Index:</span>
                    <span className="tooltip-value">#{hoveredPoint.id}</span>
                  </div>
                )}
                <div className="tooltip-row">
                  <span>Annual Income:</span>
                  <span className="tooltip-value">₹{hoveredPoint.income}k</span>
                </div>
                <div className="tooltip-row">
                  <span>Spending Score:</span>
                  <span className="tooltip-value">{hoveredPoint.score}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right Card: Segment Predictor */}
        <div className="glass-card predictor-card">
          <div className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Segment Predictor Tool
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="income-input">Annual Income</label>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#818cf8' }}>₹{inputIncome}k</span>
              </div>
              <div className="input-container">
                <input 
                  id="income-input"
                  type="number" 
                  min="5" 
                  max="160"
                  value={inputIncome} 
                  onChange={(e) => setInputIncome(Math.min(160, Math.max(1, parseInt(e.target.value, 10) || 0)))}
                  className="form-input"
                />
                <span className="input-suffix">₹k</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="150" 
                value={inputIncome}
                onChange={(e) => setInputIncome(parseInt(e.target.value, 10))}
                className="range-slider"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="score-input">Spending Score (1-100)</label>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#818cf8' }}>{inputScore}</span>
              </div>
              <div className="input-container">
                <input 
                  id="score-input"
                  type="number" 
                  min="1" 
                  max="100"
                  value={inputScore} 
                  onChange={(e) => setInputScore(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 0)))}
                  className="form-input"
                />
                <span className="input-suffix">pts</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={inputScore}
                onChange={(e) => setInputScore(parseInt(e.target.value, 10))}
                className="range-slider"
              />
            </div>

            <button 
              type="button" 
              onClick={runPrediction} 
              className="btn-predict"
              disabled={isPredicting}
            >
              {isPredicting ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeDasharray="30 15" />
                  </svg>
                  Calculating...
                </>
              ) : (
                'Run Segmentation Engine'
              )}
            </button>
          </div>

          {/* Results Output */}
          <div className={`result-box ${prediction ? 'has-result' : ''}`} style={{ borderColor: prediction?.color }}>
            {!prediction ? (
              <>
                <svg style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }} width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                  <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
                  <circle cx="8" cy="12" r="2" />
                  <circle cx="15" cy="12" r="2" />
                </svg>
                <p>Input data and submit features above to predict the target segment mapping dynamically.</p>
              </>
            ) : (
              <>
                <div className="result-header">
                  <span 
                    className="result-cluster-badge" 
                    style={{ background: prediction.color }}
                  >
                    Segment #{prediction.clusterIdx}
                  </span>
                  <h3 className="result-title">{prediction.name}</h3>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Description:</strong> {prediction.desc}
                </p>

                <div className="result-strategy" style={{ borderLeftColor: prediction.color }}>
                  <h4>Marketing Recommendation</h4>
                  <p>{getBusinessStrategy(prediction.name)}</p>
                </div>

                <div style={{ marginTop: '1rem', width: '100%' }}>
                  <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                    Distance to Cluster Centroids
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {prediction.distances.map((dist) => {
                      const isClosest = dist.cluster === prediction.clusterIdx;
                      return (
                        <div 
                          key={dist.cluster}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '0.75rem',
                            color: isClosest ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: isClosest ? '700' : '400',
                            background: isClosest ? 'rgba(255,255,255,0.04)' : 'transparent',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px'
                          }}
                        >
                          <span>{dist.name}:</span>
                          <span>{dist.distance} (dist) {isClosest ? '✓' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleResetPrediction}
                  className="btn-reset"
                >
                  Clear Predicted Point
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Model Context & Elbow Visualizer */}
      <div className="info-cards-grid">
        <div className="glass-card elbow-info">
          <div className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3v18h18" />
              <path d="M18 9l-5 6-4-4-4 4" />
            </svg>
            Optimal Cluster Selection: The Elbow Method
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            The K-Means algorithm requires defining K (number of clusters) beforehand. We ran the model multiple times (K=1 to K=8) and plotted the **WCSS (Within-Cluster Sum of Squares)**. The optimal choice is the "elbow" point, where adding more clusters yields diminishing returns in variance reduction. Click any bar below to load that K-Means parameter set into the dashboard.
          </p>

          <div className="elbow-visualizer">
            <div className="elbow-annotation">Optimal Elbow: K = 5</div>
            {elbowData.map((d) => {
              // Convert WCSS value to a relative height percentage
              const minVal = 0;
              const maxVal = 270000;
              const heightPct = 10 + ((d.wcss - minVal) / (maxVal - minVal)) * 80;
              return (
                <div 
                  key={d.k} 
                  className="elbow-bar-container" 
                  title={`${d.desc} (WCSS: ${d.wcss}) - Click to select K=${d.k}`}
                  onClick={() => {
                    setKValue(d.k);
                    setSelectedCluster(null);
                    setPrediction(null);
                  }}
                >
                  <div 
                    className={`elbow-bar ${d.optimal ? 'optimal' : ''} ${kValue === d.k ? 'active' : ''}`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className="elbow-bar-label">K={d.k}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Model Parameters Summary
          </div>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Algorithm:</span>
              <strong style={{ color: 'var(--text-primary)' }}>Standard K-Means</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Distance Function:</span>
              <strong style={{ color: 'var(--text-primary)' }}>Euclidean Distance</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Random State Seed:</span>
              <strong style={{ color: 'var(--text-primary)' }}>42 (Deterministic)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active K Selection:</span>
              <strong style={{ color: kValue === 5 ? '#10b981' : 'var(--primary)' }}>K = {kValue} {kValue === 5 ? '(Optimal)' : ''}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Trained Features:</span>
              <strong style={{ color: 'var(--text-primary)' }}>Income (₹k), Spending Score (1-100)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Customer Profile breakdowns */}
      <section className="profiles-section" id="profiles-section">
        <div className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Customer Segments Profiles & Personas
        </div>
        <div className="profiles-grid">
          {Object.keys(clusterStats).map(key => {
            const stat = clusterStats[key];
            return (
              <div 
                key={key} 
                className="glass-card profile-card"
                style={{ 
                  borderTopColor: stat.color,
                  '--cluster-color-alpha': `${stat.color}20`,
                  opacity: selectedCluster === null || selectedCluster === parseInt(key, 10) ? 1 : 0.45
                }}
              >
                <div className="profile-header">
                  <h3 className="profile-title" style={{ color: stat.color }}>{stat.name}</h3>
                  <span className="profile-badge">{stat.percentage}%</span>
                </div>
                
                <div className="profile-stats">
                  <div className="profile-stat-box">
                    <span>Avg Income</span>
                    <strong>₹{stat.avgIncome}k</strong>
                  </div>
                  <div className="profile-stat-box">
                    <span>Avg Score</span>
                    <strong>{stat.avgScore}</strong>
                  </div>
                  <div className="profile-stat-box">
                    <span>Size</span>
                    <strong>{stat.count}</strong>
                  </div>
                </div>

                <div className="profile-strategy">
                  <p style={{ fontStyle: 'italic', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    &ldquo;{stat.desc}&rdquo;
                  </p>
                  <strong style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    Campaign Strategy:
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {getBusinessStrategy(stat.name)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Data Explorer Table */}
      <section className="table-section" id="explorer-section">
        <div className="table-header-row">
          <div className="section-title" style={{ marginBottom: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Customer Segmentation Data Explorer
          </div>

          <div className="table-filters">
            {/* Search Box */}
            <div className="table-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                type="text" 
                placeholder="Search by ID, Income, Score..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Segment filter dropdown */}
            <label htmlFor="segment-filter" className="sr-only" style={{ display: 'none' }}>Filter by Segment</label>
            <select 
              id="segment-filter"
              className="filter-select"
              value={tableClusterFilter}
              onChange={(e) => {
                setTableClusterFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Segments</option>
              {Object.keys(clusterMetadata).map(key => (
                <option key={key} value={key}>{clusterMetadata[key].name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('id')}>
                  Customer ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('income')}>
                  Annual Income (₹k) {sortConfig.key === 'income' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('score')}>
                  Spending Score {sortConfig.key === 'score' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('clusterName')}>
                  Assigned Segment {sortConfig.key === 'clusterName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTableData.length > 0 ? (
                currentTableData.map(row => (
                  <tr key={row.id}>
                    <td>Customer #{row.id}</td>
                    <td>₹{row.income}k</td>
                    <td>{row.score} pts</td>
                    <td>
                      <div className="row-cluster-indicator">
                        <span 
                          className="row-color-dot" 
                          style={{ background: clusterMetadata[row.cluster].color }}
                        ></span>
                        <span>{clusterMetadata[row.cluster].name}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No customer records matched the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="table-pagination">
          <span>
            Showing {totalFilteredItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalFilteredItems)} of {totalFilteredItems} entries
          </span>
          <div className="pagination-buttons">
            <button 
              type="button" 
              className="btn-page"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', padding: '0 0.5rem', fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              type="button" 
              className="btn-page"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="app-footer">
        <p>Customer Segmentation Dashboard &bull; Powered by K-Means Clustering Algorithm &bull; © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
