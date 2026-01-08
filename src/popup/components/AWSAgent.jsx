import React, { useState } from 'react';

// AWS Service Recommender Component
const AWSAgent = () => {
  const [showForm, setShowForm] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  
  const [formData, setFormData] = useState({
    workloadType: '',
    scale: '',
    budget: '',
    trafficPattern: '',
    customization: '',
    performance: '',
    opsPreference: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowForm(false);

    // Simulate processing
    setTimeout(() => {
      const results = getAWSRecommendations(formData);
      setRecommendations(results.slice(0, 3));
      setIsLoading(false);
      setShowResults(true);
    }, 800);
  };

  const handleNewRecommendation = () => {
    setShowResults(false);
    setShowForm(true);
    setRecommendations([]);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ inputs: formData, recommendations }, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileName = `aws-recommendation-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <FormSelect
            label="Workload Type"
            name="workloadType"
            value={formData.workloadType}
            onChange={handleInputChange}
            options={[
              { value: 'webApp', label: 'Web Application' },
              { value: 'api', label: 'API Service' },
              { value: 'ml', label: 'Machine Learning' },
              { value: 'data', label: 'Data Processing' },
              { value: 'serverless', label: 'Serverless Functions' },
              { value: 'storage', label: 'Storage Solution' },
              { value: 'streaming', label: 'Streaming Data' }
            ]}
          />

          <FormSelect
            label="Scale"
            name="scale"
            value={formData.scale}
            onChange={handleInputChange}
            options={[
              { value: 'small', label: 'Small (1-100 users)' },
              { value: 'medium', label: 'Medium (100-1000 users)' },
              { value: 'large', label: 'Large (1000-10000 users)' },
              { value: 'enterprise', label: 'Enterprise (10000+ users)' }
            ]}
          />

          <FormSelect
            label="Budget"
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            options={[
              { value: 'veryLow', label: 'Very Low ($1-100/month)' },
              { value: 'low', label: 'Low ($100-500/month)' },
              { value: 'medium', label: 'Medium ($500-2000/month)' },
              { value: 'high', label: 'High ($2000+/month)' }
            ]}
          />

          <FormSelect
            label="Traffic Pattern"
            name="trafficPattern"
            value={formData.trafficPattern}
            onChange={handleInputChange}
            options={[
              { value: 'predictable', label: 'Predictable (Consistent)' },
              { value: 'variable', label: 'Variable (Day/Night cycles)' },
              { value: 'spiky', label: 'Spiky (Unpredictable bursts)' }
            ]}
          />

          <FormSelect
            label="Customization Level"
            name="customization"
            value={formData.customization}
            onChange={handleInputChange}
            options={[
              { value: 'low', label: 'Low (Standard configurations)' },
              { value: 'medium', label: 'Medium (Some customizations)' },
              { value: 'high', label: 'High (Heavily customized)' }
            ]}
          />

          <FormSelect
            label="Performance Requirement"
            name="performance"
            value={formData.performance}
            onChange={handleInputChange}
            options={[
              { value: 'standard', label: 'Standard (< 1s response)' },
              { value: 'high', label: 'High Performance (< 500ms)' },
              { value: 'lowLatency', label: 'Low Latency (< 100ms)' }
            ]}
          />

          <FormSelect
            label="Operations Preference"
            name="opsPreference"
            value={formData.opsPreference}
            onChange={handleInputChange}
            options={[
              { value: 'fullyManaged', label: 'Fully Managed' },
              { value: 'partial', label: 'Partial Control' },
              { value: 'fullControl', label: 'Full Control' }
            ]}
          />

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            Get Recommendations
          </button>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="w-10 h-10 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Analyzing your requirements...</p>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">Recommended AWS Services</h3>
          
          {recommendations.map((rec, idx) => (
            <RecommendationCard key={idx} recommendation={rec} />
          ))}

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleNewRecommendation}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              New Recommendation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Select Component
const FormSelect = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full bg-gray-750 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-orange-500"
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Recommendation Card Component
const RecommendationCard = ({ recommendation }) => (
  <div className="bg-gray-750 rounded-lg p-3 space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm font-semibold text-gray-200">{recommendation.service}</h4>
        <p className="text-xs text-gray-400">{recommendation.category}</p>
      </div>
      <span className="bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded">
        {Math.round(recommendation.score)}%
      </span>
    </div>
    
    <p className="text-xs text-gray-300">{recommendation.description}</p>
    
    {recommendation.reason && (
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-1">Why it fits:</p>
        <p className="text-xs text-gray-300">{recommendation.reason}</p>
      </div>
    )}
    
    {recommendation.pros && recommendation.pros.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-green-400 mb-1">Pros:</p>
        <ul className="text-xs text-gray-300 list-disc list-inside space-y-0.5">
          {recommendation.pros.slice(0, 3).map((pro, idx) => (
            <li key={idx}>{pro}</li>
          ))}
        </ul>
      </div>
    )}
    
    {recommendation.cons && recommendation.cons.length > 0 && (
      <div>
        <p className="text-xs font-semibold text-red-400 mb-1">Cons:</p>
        <ul className="text-xs text-gray-300 list-disc list-inside space-y-0.5">
          {recommendation.cons.slice(0, 2).map((con, idx) => (
            <li key={idx}>{con}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// AWS Recommendation Engine (simplified version)
const getAWSRecommendations = (inputs) => {
  // Import the recommendation logic from awsServiceRecom
  // This is a simplified version - you can expand it
  const services = getAWSServices();
  const weights = {
    WORKLOAD_TYPE: 2.5,
    SCALE: 1.5,
    BUDGET: 2.0,
    TRAFFIC_PATTERN: 1.5,
    CUSTOMIZATION: 1.0,
    PERFORMANCE: 1.8,
    OPS_PREFERENCE: 2.0
  };

  const maxPossible = Object.values(weights).reduce((a, b) => a + b, 0) * 100;
  const recommendations = [];

  for (const [serviceName, serviceData] of Object.entries(services)) {
    const scores = serviceData.compatibilityScores;
    let totalScore = 0;
    let reasonDetails = [];

    totalScore += (scores.workloadType[inputs.workloadType] || 50) * weights.WORKLOAD_TYPE;
    totalScore += (scores.scale[inputs.scale] || 50) * weights.SCALE;
    totalScore += (scores.budget[inputs.budget] || 50) * weights.BUDGET;
    totalScore += (scores.trafficPattern[inputs.trafficPattern] || 50) * weights.TRAFFIC_PATTERN;
    totalScore += (scores.customization[inputs.customization] || 50) * weights.CUSTOMIZATION;
    totalScore += (scores.performance[inputs.performance] || 50) * weights.PERFORMANCE;
    totalScore += (scores.opsPreference[inputs.opsPreference] || 50) * weights.OPS_PREFERENCE;

    const normalizedScore = Math.round((totalScore / maxPossible) * 100);

    if (scores.workloadType[inputs.workloadType] >= 85) {
      reasonDetails.push(`Highly suitable for ${inputs.workloadType} workloads`);
    }
    if (scores.scale[inputs.scale] >= 85) {
      reasonDetails.push(`Works well at ${inputs.scale} scale`);
    }

    recommendations.push({
      service: serviceName,
      category: serviceData.category,
      description: serviceData.description,
      score: normalizedScore,
      reason: reasonDetails.join('. '),
      pros: serviceData.pros,
      cons: serviceData.cons
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
};

// Simplified AWS Services data
const getAWSServices = () => ({
  Lambda: {
    category: "Compute",
    description: "Run code without thinking about servers",
    compatibilityScores: {
      workloadType: { webApp: 70, api: 90, ml: 60, data: 75, serverless: 100, storage: 50, streaming: 80 },
      scale: { small: 95, medium: 90, large: 80, enterprise: 70 },
      budget: { veryLow: 95, low: 90, medium: 80, high: 70 },
      trafficPattern: { predictable: 80, variable: 90, spiky: 95 },
      customization: { low: 90, medium: 80, high: 50 },
      performance: { standard: 85, high: 70, lowLatency: 40 },
      opsPreference: { fullyManaged: 95, partial: 70, fullControl: 30 }
    },
    pros: ["Zero server management", "Pay per request", "Automatic scaling", "Built-in fault tolerance"],
    cons: ["15-minute max execution", "Cold start latency", "Limited customization", "10GB memory limit"]
  },
  EC2: {
    category: "Compute",
    description: "Virtual servers in the cloud",
    compatibilityScores: {
      workloadType: { webApp: 80, api: 75, ml: 70, data: 80, serverless: 20, storage: 40, streaming: 60 },
      scale: { small: 50, medium: 80, large: 90, enterprise: 95 },
      budget: { veryLow: 30, low: 60, medium: 80, high: 90 },
      trafficPattern: { predictable: 90, variable: 70, spiky: 50 },
      customization: { low: 50, medium: 80, high: 95 },
      performance: { standard: 80, high: 85, lowLatency: 90 },
      opsPreference: { fullyManaged: 30, partial: 70, fullControl: 95 }
    },
    pros: ["Maximum flexibility", "Wide range of instance types", "Supports any workload", "Cost-effective for steady loads"],
    cons: ["Significant operational overhead", "Manual scaling", "Capacity planning required", "Pay for idle capacity"]
  },
  S3: {
    category: "Storage",
    description: "Object storage service",
    compatibilityScores: {
      workloadType: { webApp: 80, api: 70, ml: 75, data: 90, serverless: 85, storage: 100, streaming: 70 },
      scale: { small: 90, medium: 90, large: 90, enterprise: 90 },
      budget: { veryLow: 85, low: 90, medium: 90, high: 90 },
      trafficPattern: { predictable: 90, variable: 90, spiky: 90 },
      customization: { low: 90, medium: 85, high: 75 },
      performance: { standard: 85, high: 80, lowLatency: 60 },
      opsPreference: { fullyManaged: 95, partial: 85, fullControl: 70 }
    },
    pros: ["Unlimited scalability", "99.999999999% durability", "Cost-effective", "Multiple storage classes"],
    cons: ["Not for file system access", "Cannot be boot volume", "Not for frequently changing data"]
  },
  RDS: {
    category: "Database",
    description: "Managed relational database service",
    compatibilityScores: {
      workloadType: { webApp: 90, api: 85, ml: 70, data: 85, serverless: 70, storage: 75, streaming: 60 },
      scale: { small: 85, medium: 90, large: 80, enterprise: 75 },
      budget: { veryLow: 60, low: 75, medium: 85, high: 90 },
      trafficPattern: { predictable: 90, variable: 80, spiky: 65 },
      customization: { low: 90, medium: 85, high: 70 },
      performance: { standard: 85, high: 80, lowLatency: 75 },
      opsPreference: { fullyManaged: 90, partial: 80, fullControl: 60 }
    },
    pros: ["Managed database", "Automated backups", "Multi-AZ deployments", "Multiple DB engines"],
    cons: ["Higher cost", "Limited admin access", "Maintenance windows", "Fixed scaling increments"]
  },
  DynamoDB: {
    category: "Database",
    description: "Managed NoSQL database service",
    compatibilityScores: {
      workloadType: { webApp: 80, api: 90, ml: 70, data: 85, serverless: 95, storage: 80, streaming: 85 },
      scale: { small: 90, medium: 90, large: 95, enterprise: 95 },
      budget: { veryLow: 75, low: 85, medium: 90, high: 90 },
      trafficPattern: { predictable: 85, variable: 90, spiky: 95 },
      customization: { low: 90, medium: 80, high: 60 },
      performance: { standard: 90, high: 95, lowLatency: 95 },
      opsPreference: { fullyManaged: 95, partial: 80, fullControl: 50 }
    },
    pros: ["Fully managed NoSQL", "Single-digit ms latency", "Unlimited throughput", "Auto-scaling", "Global tables"],
    cons: ["Limited query patterns", "Not for complex joins", "Different data modeling", "Provisioned capacity monitoring"]
  }
});

export default AWSAgent;
