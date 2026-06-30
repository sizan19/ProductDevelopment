// Accessible star rating (read-only). Renders 5 stars, fills `value`.
import Icon from './Icon';

function StarRating({ value = 0, max = 5 }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size={16}
          className={i < rounded ? '' : 'star--empty'}
          style={{ fill: i < rounded ? 'currentColor' : 'none' }}
        />
      ))}
    </span>
  );
}

export default StarRating;
