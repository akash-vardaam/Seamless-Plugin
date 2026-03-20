<?php

namespace SeamlessAddon\Integrations\Elementor\DynamicTags\EventTags;

use Elementor\Core\DynamicTags\Data_Tag;

/**
 * Base Event Data Tag
 * 
 * Base class for event-related DATA dynamic tags (Images, Gallery, URL, Color, etc.)
 * Extends Data_Tag which requires get_value() method.
 */
abstract class BaseEventDataTag extends Data_Tag
{
    use EventDataTrait;
}
