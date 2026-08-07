import numpy as np
import pandas as pd

def generate_ahhe_pricing_dataset(num_samples=2500, random_state=42):
    """
    Generates synthetic historical booking dataset for Ahmedabad Old City Pol homestays,
    incorporating festival demand multipliers, Pol architectural popularity, and room types.
    """
    np.random.seed(random_state)

    pols = ['Mangaldas Pol', 'Dhal ni Pol', 'Manek Chowk Pol', 'Asodia Pol', 'Khadia Pol']
    pol_weights = {'Mangaldas Pol': 1.30, 'Dhal ni Pol': 1.20, 'Manek Chowk Pol': 1.25, 'Asodia Pol': 1.05, 'Khadia Pol': 1.10}

    room_types = ['private_room', 'entire_haveli', 'shared_room']
    room_type_base = {'private_room': 2500.0, 'entire_haveli': 8500.0, 'shared_room': 1200.0}

    festival_tags = ['uttarayan', 'navratri', 'diwali', 'none']
    festival_multipliers = {'uttarayan': 2.20, 'navratri': 1.80, 'diwali': 1.60, 'none': 1.00}

    data = []
    for _ in range(num_samples):
        pol = np.random.choice(pols)
        room_type = np.random.choice(room_types, p=[0.6, 0.25, 0.15])
        max_guests = np.random.randint(1, 8) if room_type != 'entire_haveli' else np.random.randint(6, 16)
        heritage_verified = int(np.random.rand() > 0.35)
        festival = np.random.choice(festival_tags, p=[0.25, 0.25, 0.20, 0.30])
        days_to_event = np.random.randint(1, 60)

        # Base calculation
        base_price = room_type_base[room_type]
        guest_multiplier = 1.0 + (max_guests - 1) * 0.12
        pol_mult = pol_weights[pol]
        heritage_mult = 1.15 if heritage_verified else 1.0
        fest_mult = festival_multipliers[festival]

        # Days to event proximity urgency (higher price closer to event for festival stays)
        urgency_mult = 1.0
        if festival != 'none':
            if days_to_event <= 7:
                urgency_mult = 1.25
            elif days_to_event <= 14:
                urgency_mult = 1.15

        # Calculate target suggested price with gaussian noise
        target_price = base_price * guest_multiplier * pol_mult * heritage_mult * fest_mult * urgency_mult
        target_price += np.random.normal(0, target_price * 0.05)  # 5% noise
        target_price = round(max(target_price, 800.0), 2)

        data.append({
            'pol_name': pol,
            'room_type': room_type,
            'max_guests': max_guests,
            'heritage_verified': heritage_verified,
            'festival_tag': festival,
            'days_to_event': days_to_event,
            'suggested_price': target_price
        })

    return pd.DataFrame(data)

if __name__ == '__main__':
    df = generate_ahhe_pricing_dataset()
    print(f"Generated dataset with {len(df)} records:")
    print(df.head())
