export function interpolate(value, min, max, targetRangeMin, targetRangeMax) {
	const 
		result = targetRangeMin + (targetRangeMax - targetRangeMin) * (value - min) / (max - min);
		
	return result;
};

export function interpolateClamp(value, min, max, targetRangeMin, targetRangeMax) {
	const 
		result = targetRangeMin + (targetRangeMax - targetRangeMin) * (value - min) / (max - min);
		
	return Math.max(targetRangeMin, Math.min(result, targetRangeMax));
};

export function norm(value, min, max) {
	return (value - min) / (max - min);
}

export function normClamp(val, min, max) {
    const result = Math.max(0, Math.min((val - min) / (max - min), 1));
    return result;
}

export function lerp(norm, min, max) {
	return (max - min) * norm + min;
}

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
