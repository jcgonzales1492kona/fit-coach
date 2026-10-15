const FOODS_RAW=`Chicken breast, cooked|165|31|0|3.6
Chicken breast, raw|120|22.5|0|2.6
Chicken thigh, cooked|209|26|0|10.9
Chicken thigh, raw|177|17.9|0|11.2
Chicken drumstick, cooked|172|28.3|0|5.7
Chicken wings, cooked|203|30.5|0|8.1
Rotisserie chicken|190|28|0|8
Ground chicken, cooked|189|23.3|0|10.9
Ground beef 90/10, cooked|217|26.1|0|11.7
Ground beef 80/20, cooked|254|25.9|0|16
Ground beef 93/7, raw|152|21|0|7
Sirloin steak, cooked|206|29|0|9.2
Ribeye steak, cooked|291|24|0|21
Flank steak, cooked|192|28|0|8
Beef jerky|410|33|11|26
Roast beef deli|120|20|2|3.5
Ground turkey 93/7, cooked|176|22.3|0|9.6
Ground turkey 99/1, cooked|130|28|0|1.5
Turkey breast, roasted|135|30|0|1
Turkey deli slices|104|17|4|2
Turkey bacon|226|30|3|10
Pork tenderloin, cooked|143|26|0|3.5
Pork chop, cooked|231|25.7|0|13.6
Bacon, cooked|541|37|1.4|42
Ham deli|145|21|1.5|5.5
Chicken sausage|170|14|3|11
Egg, whole|143|12.6|0.7|9.5
Egg whites|52|10.9|0.7|0.2
Liquid egg whites|48|10|1|0
Greek yogurt nonfat plain|59|10.3|3.6|0.4
Greek yogurt 2% plain|73|9.9|3.9|2
Greek yogurt whole plain|97|9|4|5
Greek yogurt vanilla nonfat|78|8.5|10|0
Cottage cheese 2%|84|11|4.3|2.3
Cottage cheese 1%|72|12.4|2.7|1
Skyr plain|63|11|4|0.2
Milk skim|34|3.4|5|0.1
Milk 2%|50|3.3|4.8|2
Milk whole|61|3.2|4.8|3.3
Almond milk unsweetened|15|0.6|0.3|1.2
Cheddar cheese|403|25|1.3|33
Mozzarella part-skim|254|24|2.8|16
String cheese|286|25|3.6|18
Parmesan|431|38|4.1|29
Swiss cheese|380|27|1.5|28
Feta|264|14|4|21
Cream cheese|342|6|4|34
Shredded Mexican blend|393|23|3|32
Butter|717|0.9|0.1|81
Whey protein powder|380|78|8|5
Casein protein powder|360|75|10|3
Plant protein powder|370|70|10|7
Protein bar (avg)|360|33|38|12
White rice, cooked|130|2.7|28|0.3
Brown rice, cooked|123|2.7|25.6|1
Jasmine rice, cooked|129|2.7|28|0.2
Quinoa, cooked|120|4.4|21.3|1.9
Rolled oats, dry|379|13.2|67.7|6.5
Oatmeal, cooked|71|2.5|12|1.5
Cream of rice, dry|370|6|82|0.5
Pasta, cooked|158|5.8|31|0.9
Pasta, dry|371|13|75|1.5
Whole wheat pasta, cooked|149|6|30|1.7
Egg noodles, cooked|138|4.5|25|2.1
Flour tortilla|306|8.2|50|8
Corn tortilla|218|5.7|44.6|2.9
Low carb tortilla|200|15|45|6
White bread|265|9|49|3.2
Whole wheat bread|252|12.5|43|3.5
Sourdough bread|274|11|52|2
Bagel|257|10|50|1.7
English muffin|227|8.9|44|1.7
Potato, baked|93|2.5|21|0.1
Sweet potato, baked|90|2|20.7|0.2
French fries|312|3.4|41|15
Black beans, cooked|132|8.9|23.7|0.5
Pinto beans, cooked|143|9|26|0.7
Kidney beans, cooked|127|8.7|22.8|0.5
Chickpeas, cooked|164|8.9|27.4|2.6
Lentils, cooked|116|9|20|0.4
Refried beans|91|5.4|15|1.2
Edamame|121|11.9|8.9|5.2
Tofu firm|144|17.3|2.8|8.7
Hummus|166|7.9|14.3|9.6
Granola|471|10|64|20
Cheerios|367|12|73|6.7
Corn flakes|357|7.5|84|0.4
Rice cakes|387|8|81|2.8
Crackers|484|9|67|21
Popcorn, air-popped|387|13|78|4.5
Tortilla chips|489|7|65|23
Broccoli|34|2.8|6.6|0.4
Spinach|23|2.9|3.6|0.4
Kale|49|4.3|8.8|0.9
Romaine lettuce|17|1.2|3.3|0.3
Mixed greens|20|1.5|3.5|0.2
Carrots|41|0.9|9.6|0.2
Bell pepper|31|1|6|0.3
Onion|40|1.1|9.3|0.1
Tomato|18|0.9|3.9|0.2
Cucumber|15|0.7|3.6|0.1
Zucchini|17|1.2|3.1|0.3
Green beans|31|1.8|7|0.2
Asparagus|20|2.2|3.9|0.1
Cauliflower|25|1.9|5|0.3
Brussels sprouts|43|3.4|9|0.3
Mushrooms|22|3.1|3.3|0.3
Corn kernels|86|3.3|19|1.4
Peas|81|5.4|14.5|0.4
Celery|16|0.7|3|0.2
Cabbage|25|1.3|5.8|0.1
Avocado|160|2|8.5|14.7
Salsa|36|1.5|7|0.2
Banana|89|1.1|22.8|0.3
Apple|52|0.3|13.8|0.2
Orange|47|0.9|11.8|0.1
Strawberries|32|0.7|7.7|0.3
Blueberries|57|0.7|14.5|0.3
Raspberries|52|1.2|11.9|0.7
Grapes|69|0.7|18|0.2
Pineapple|50|0.5|13|0.1
Mango|60|0.8|15|0.4
Watermelon|30|0.6|7.6|0.2
Pear|57|0.4|15|0.1
Peach|39|0.9|9.5|0.3
Cherries|63|1.1|16|0.2
Raisins|299|3.1|79|0.5
Dates|282|2.5|75|0.4
Frozen mixed berries|50|0.7|12|0.3
Peanut butter|588|25|20|50
Almond butter|614|21|19|56
Almonds|579|21|21.6|49.9
Peanuts|567|25.8|16|49
Walnuts|654|15|14|65
Cashews|553|18|30|44
Chia seeds|486|16.5|42|30.7
Olive oil|884|0|0|100
Avocado oil|884|0|0|100
Honey|304|0.3|82|0
Maple syrup|260|0|67|0.1
Jam|250|0.4|65|0.1
Dark chocolate 70%|598|7.8|46|43
Ketchup|112|1.7|26|0.1
Mayonnaise|680|1|0.6|75
Light mayo|260|0.5|9|25
Ranch dressing|430|1.3|6|45
BBQ sauce|172|0.8|41|0.6
Marinara sauce|50|1.5|8|1.5
Pizza, cheese|266|11|33|10
Burrito bowl (avg)|150|9|17|5
Ice cream vanilla|207|3.5|24|11
Orange juice|45|0.7|10.4|0.2
Sports drink|26|0|6.4|0`;
const FOODS=FOODS_RAW.split('\n').map((l,i)=>{const[n,k,p,c,f]=l.split('|');return{id:'b'+i,name:n,kcal:+k,p:+p,c:+c,f:+f}});
// exercises: name|primary muscle|type(c=compound,i=isolation)
const EX_RAW=`Barbell Bench Press|chest|c
Incline Dumbbell Press|chest|c
Dumbbell Bench Press|chest|c
Machine Chest Press|chest|c
Incline Barbell Press|chest|c
Cable Fly|chest|i
Pec Deck|chest|i
Push-Up|chest|c
Dip|chest|c
Pull-Up|back|c
Lat Pulldown|back|c
Barbell Row|back|c
Seated Cable Row|back|c
Chest-Supported Row|back|c
One-Arm Dumbbell Row|back|c
Machine Row|back|c
Straight-Arm Pulldown|back|i
Overhead Press|shoulders|c
Seated Dumbbell Press|shoulders|c
Machine Shoulder Press|shoulders|c
Dumbbell Lateral Raise|shoulders|i
Cable Lateral Raise|shoulders|i
Rear Delt Fly|shoulders|i
Face Pull|shoulders|i
Barbell Curl|biceps|i
Dumbbell Curl|biceps|i
Incline Dumbbell Curl|biceps|i
Hammer Curl|biceps|i
Cable Curl|biceps|i
Preacher Curl|biceps|i
Triceps Pushdown|triceps|i
Overhead Cable Extension|triceps|i
Skull Crusher|triceps|i
Close-Grip Bench Press|triceps|c
Dumbbell Overhead Extension|triceps|i
Back Squat|quads|c
Front Squat|quads|c
Hack Squat|quads|c
Leg Press|quads|c
Bulgarian Split Squat|quads|c
Walking Lunge|quads|c
Leg Extension|quads|i
Goblet Squat|quads|c
Romanian Deadlift|hamstrings|c
Stiff-Leg Deadlift|hamstrings|c
Lying Leg Curl|hamstrings|i
Seated Leg Curl|hamstrings|i
Good Morning|hamstrings|c
Nordic Curl|hamstrings|i
Hip Thrust|glutes|c
Glute Bridge|glutes|c
Cable Kickback|glutes|i
Hip Abduction Machine|glutes|i
Deadlift|glutes|c
Step-Up|glutes|c
Standing Calf Raise|calves|i
Seated Calf Raise|calves|i
Leg Press Calf Raise|calves|i
Cable Crunch|abs|i
Hanging Leg Raise|abs|i
Ab Wheel Rollout|abs|i
Plank|abs|i`;
const EXERCISES=EX_RAW.split('\n').map(l=>{const[n,m,t]=l.split('|');return{name:n,muscle:m,type:t}});
const MUSCLES=['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','abs'];

const VIDEOS={"Barbell Bench Press": "ptpmRrzRtWQ", "Incline Dumbbell Press": "0f6-uCUKqgA", "Dumbbell Bench Press": "YQ2s_Y7g5Qk", "Machine Chest Press": "NwzUje3z0qY", "Cable Fly": "4mfLHnFL0Uw", "Pec Deck": "O-OBCfyh9Fw", "Push-Up": "5aRHy5ZPjwk", "Dip": "yN6Q1UI_xkE", "Pull-Up": "Hdc7Mw6BIEE", "Lat Pulldown": "O94yEoGXtBY", "Barbell Row": "axoeDmW0oAY", "Seated Cable Row": "UCXxvVItLoM", "One-Arm Dumbbell Row": "djKXLt7kv7Q", "Machine Row": "5XfV6hvcxCE", "Straight-Arm Pulldown": "G9uNaXGTJ4w", "Overhead Press": "_RlRDWO2jfg", "Seated Dumbbell Press": "HzIiNhHhhtA", "Machine Shoulder Press": "WvLMauqrnK8", "Dumbbell Lateral Raise": "4hTUCDUQaNA", "Cable Lateral Raise": "lq7eLC30b9w", "Rear Delt Fly": "qfc70k40318", "Face Pull": "cc0tasCalHg", "Barbell Curl": "-moSw0_zJ5c", "Dumbbell Curl": "iixND1P2lik", "Incline Dumbbell Curl": "aTYlqC_JacQ", "Hammer Curl": "XOEL4MgekYE", "Cable Curl": "opFVuRi_3b8", "Preacher Curl": "sxA__DoLsgo", "Triceps Pushdown": "popGXI-qs98", "Overhead Cable Extension": "1u18yJELsh0", "Skull Crusher": "8t2a93BjDec", "Back Squat": "bEv6CCg2BC8", "Front Squat": "v-mQm_droHg", "Hack Squat": "rYgNArpwE7E", "Leg Press": "B6rGDcfyPto", "Bulgarian Split Squat": "jNihW0WDIL4", "Walking Lunge": "eFWCn5iEbTU", "Leg Extension": "ljO4jkwv8wQ", "Romanian Deadlift": "_oyxCn2iSjU", "Lying Leg Curl": "n5WDXD_mpVY", "Seated Leg Curl": "Orxowest56U", "Good Morning": "f23vXjoG2e8", "Hip Thrust": "xDmFkJxPzeM", "Cable Kickback": "dJa_Nf4zdik", "Deadlift": "VL5Ab0T07e4", "Standing Calf Raise": "xLikAVQTKqc", "Cable Crunch": "6GMKPQVERzw", "Hanging Leg Raise": "7FwGZ8qY5OU"};
