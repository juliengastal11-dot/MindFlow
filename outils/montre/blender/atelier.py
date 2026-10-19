# L'atelier : ce qui sert à toutes les scènes de la montre dans Blender (sans fenêtre). Importé par les scripts de montage.
import bpy, math, os
from mathutils import Vector, Matrix

BLENDER = os.path.dirname(bpy.app.binary_path)
HDRI = os.path.join(BLENDER, "5.2", "datafiles", "studiolights", "world")

def scene_vide():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene

def rendu(sc, l, h, echantillons=96, gpu=True):
    sc.render.engine = "CYCLES"
    if gpu:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == "OPTIX"
        sc.cycles.device = "GPU"
    sc.cycles.samples = echantillons
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPTIX" if gpu else "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 8
    sc.cycles.glossy_bounces = 6
    sc.cycles.transmission_bounces = 8
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.resolution_x, sc.render.resolution_y = l, h
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "8"
    for vt in ("Khronos PBR Neutral", "Standard", "AgX"):
        try:
            sc.view_settings.view_transform = vt
            break
        except TypeError:
            continue
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0

def monde(sc, nom="studio.exr", force=1.0, rotation=0.0):
    w = bpy.data.worlds.new("Monde"); sc.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping"); mapping.inputs["Rotation"].default_value = (0, 0, rotation)
    env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(os.path.join(HDRI, nom))
    bg = nt.nodes.new("ShaderNodeBackground"); bg.inputs["Strength"].default_value = force
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return w

def ciel_studio(sc, haut=1.6, horizon=0.55, bas=0.12, teinte=(1.0, 0.98, 0.95)):
    """Un ciel de studio : clair au zénith, gris à l'horizon, sombre en dessous. L'or y reflète un dégradé doux."""
    w = bpy.data.worlds.new("Studio"); sc.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    # Generated va de 0 à 1 : z = 0,5 à l'horizon
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE"
    e = ramp.color_ramp.elements
    e[0].position = 0.0; e[0].color = (bas, bas, bas, 1)
    e[1].position = 0.5; e[1].color = (horizon, horizon, horizon, 1)
    e2 = e.new(1.0); e2.color = (haut * teinte[0], haut * teinte[1], haut * teinte[2], 1)
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    bg = nt.nodes.new("ShaderNodeBackground")
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"]); nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return w

def lampe(sc, nom, position, vise=(0, 0, 0), energie=300, taille=1.0, couleur=(1, 1, 1), forme="SQUARE"):
    l = bpy.data.lights.new(nom, "AREA"); l.energy = energie; l.size = taille; l.color = couleur; l.shape = forme
    o = bpy.data.objects.new(nom, l); sc.collection.objects.link(o)
    o.location = position
    d = Vector(vise) - Vector(position)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o

def camera(sc, position, vise, focale=85, capteur=36):
    c = bpy.data.cameras.new("Cam"); c.lens = focale; c.sensor_width = capteur; c.sensor_fit = "VERTICAL"
    o = bpy.data.objects.new("Cam", c); sc.collection.objects.link(o); sc.camera = o
    o.location = position
    d = Vector(vise) - Vector(position)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o

# --- matières ----------------------------------------------------------------------------------------------------------
def _principled(nom):
    m = bpy.data.materials.new(nom); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    return m, p

def or_poli(nom="Or", teinte=(1.0, 0.76, 0.36), rugosite=0.16):
    m, p = _principled(nom)
    p.inputs["Base Color"].default_value = (*teinte, 1)
    p.inputs["Metallic"].default_value = 1.0
    p.inputs["Roughness"].default_value = rugosite
    p.inputs["Coat Weight"].default_value = 0.0
    return m

def acier(nom="Acier", rugosite=0.3):
    m, p = _principled(nom)
    p.inputs["Base Color"].default_value = (0.85, 0.85, 0.86, 1)
    p.inputs["Metallic"].default_value = 1.0
    p.inputs["Roughness"].default_value = rugosite
    return m

def verre(nom="Verre", ior=1.76):
    """Un saphir : verre net ; vu de la caméra, du verre ; vu par une ombre ou un rebond diffus, transparent (pas d'ombre
    noire d'un verre non caustique)."""
    m = bpy.data.materials.new(nom); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    g = nt.nodes.new("ShaderNodeBsdfGlass"); g.inputs["Roughness"].default_value = 0.01; g.inputs["IOR"].default_value = ior
    g.inputs["Color"].default_value = (0.98, 0.99, 1.0, 1)
    t = nt.nodes.new("ShaderNodeBsdfTransparent")
    lp = nt.nodes.new("ShaderNodeLightPath")
    mx = nt.nodes.new("ShaderNodeMixShader")
    # fac = 1 (transparent) pour les rayons d'ombre et diffus, 0 (verre) pour la caméra et les reflets
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
    nt.links.new(lp.outputs["Is Shadow Ray"], add.inputs[0]); nt.links.new(lp.outputs["Is Diffuse Ray"], add.inputs[1])
    nt.links.new(add.outputs["Value"], mx.inputs["Fac"])
    nt.links.new(g.outputs["BSDF"], mx.inputs[1]); nt.links.new(t.outputs["BSDF"], mx.inputs[2])
    nt.links.new(mx.outputs["Shader"], out.inputs["Surface"])
    return m

def texture_image(m, chemin, entree="Base Color", colorspace="sRGB", non_couleur=False):
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(chemin)
    if non_couleur: t.image.colorspace_settings.name = "Non-Color"
    nt.links.new(t.outputs["Color"], p.inputs[entree])
    return t

# --- géométrie ---------------------------------------------------------------------------------------------------------
def boite(o):
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    return mn, mx

def lisser(o, angle=math.radians(35)):
    o.data.shade_smooth()
    for p in o.data.polygons: p.use_smooth = True
    if hasattr(o.data, "set_sharp_from_angle"):
        o.data.set_sharp_from_angle(angle=angle)

def separer_par_masque(o, garde, nom):
    """Un nouvel objet avec les faces de `o` dont le centre vérifie `garde(point_monde)`, retirées de `o`."""
    import bmesh
    bm = bmesh.new(); bm.from_mesh(o.data)
    M = o.matrix_world
    faces = [f for f in bm.faces if garde(M @ f.calc_center_median())]
    bm2 = bmesh.new()
    # copie des faces sélectionnées
    sel = bmesh.ops.split(bm, geom=faces, use_only_faces=False)["geom"]
    deplacer = [g for g in sel if isinstance(g, bmesh.types.BMFace)]
    me = bpy.data.meshes.new(nom)
    bm_new = bmesh.new()
    vmap = {}
    for f in deplacer:
        vs = []
        for v in f.verts:
            if v not in vmap: vmap[v] = bm_new.verts.new(v.co)
            vs.append(vmap[v])
        try:
            nf = bm_new.faces.new(vs); nf.material_index = f.material_index
        except ValueError:
            pass
    # uv
    if bm.loops.layers.uv:
        src = bm.loops.layers.uv.active; dst = bm_new.loops.layers.uv.new(src.name)
        for f, nf in zip(deplacer, [f for f in bm_new.faces]):
            for l, nl in zip(f.loops, nf.loops): nl[dst].uv = l[src].uv
    bmesh.ops.delete(bm, geom=deplacer, context="FACES")
    bm.to_mesh(o.data); bm.free()
    bm_new.to_mesh(me); bm_new.free()
    n = bpy.data.objects.new(nom, me); bpy.context.scene.collection.objects.link(n)
    n.matrix_world = o.matrix_world.copy()
    for mat in o.data.materials: me.materials.append(mat)
    return n
