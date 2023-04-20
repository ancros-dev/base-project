import BezierEasing from 'bezier-easing';

export default {
	in: BezierEasing(0, 0, 0.2, 1),
	out: BezierEasing(0.40, 0.00, 1.00, 1.00),
	inOut: BezierEasing(0.40, 0.00, 0.20, 1.00),
}